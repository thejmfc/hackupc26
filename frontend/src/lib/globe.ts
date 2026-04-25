import type { RefObject } from 'react';

import { fetchCapitals } from './capitals';
import { fetchAirports, fetchAirportByIata, addAirportMarkers, type Airport } from '../components/Airport';
import { notifySelection, onClear, onRoute, onReset, onSidequests } from './airportStore';
import type { SidequestResponse, Activity } from '../types/sidequest';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export const markerColour = '#ff0000';

export default class Globe {
    map: mapboxgl.Map;
    markers: mapboxgl.Marker[];

    private airportMarkers: mapboxgl.Marker[] = [];
    private routeMarkers: mapboxgl.Marker[] = [];
    private sidequestMarkers: mapboxgl.Marker[] = [];
    private routeActive = false;
    private departureAirport: Airport | null = null;
    private destinationAirport: Airport | null = null;
    private shownAirports: Airport[] = [];

    constructor(ref: RefObject<HTMLDivElement | null>) {
        this.map = new mapboxgl.Map({
            container: ref.current!,
        });
        this.map.setStyle(import.meta.env.VITE_BLANK_URL);
        this.markers = [];

        this.map.on('load', () => {
            this.map.addSource('route', {
                type: 'geojson',
                data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
            });
            this.map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                paint: {
                    'line-color': '#f59e0b',
                    'line-width': 2.5,
                    'line-dasharray': [4, 3],
                },
            });

            fetchCapitals()
                .then(capitals => capitals.forEach(c => this.addMarker(c)))
                .catch(err => console.error('Error fetching capitals:', err));
        });

        const unsubClear = onClear(() => {
            this.departureAirport = null;
            this.destinationAirport = null;
            this.airportMarkers.forEach(m => m.remove());
            this.airportMarkers = [];
            this.shownAirports = [];
        });

        const unsubRoute = onRoute(async (iatas) => {
            if (!this.map.getCanvas()) return;
            this._clearSidequests();
            const airports = (await Promise.all(iatas.map(iata => fetchAirportByIata(iata))))
                .filter((a): a is Airport => a !== null);
            if (airports.length < 2) {
                console.warn('[Globe] Could not resolve route airports:', iatas, airports);
                return;
            }
            this._clearRoute();

            // Hide all capital markers and airport pins — show only the route airports
            this.markers.forEach(m => m.getElement().style.display = 'none');
            this.airportMarkers.forEach(m => m.remove());
            this.airportMarkers = [];
            this.shownAirports = [];
            this.routeActive = true;

            // Place a dot marker for every airport on the route
            airports.forEach(a => {
                const el = document.createElement('div');
                el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#f59e0b;border:2px solid #92400e;cursor:default;';
                el.title = a.name;
                this.routeMarkers.push(
                    new mapboxgl.Marker({ element: el })
                        .setLngLat(a.coords)
                        .setPopup(new mapboxgl.Popup({ offset: 10 }).setText(a.name))
                        .addTo(this.map)
                );
            });

            // Draw route line
            const src = this.map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
            if (!src) {
                console.error('[Globe] route source not found — style may not have loaded yet');
                return;
            }
            src.setData({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: airports.map(a => a.coords) },
            });
        });

        const unsubReset = onReset(() => {
            if (!this.map.getCanvas()) return;
            this._clearRoute();
            this._clearSidequests();
            this.routeActive = false;
            // Restore capital markers
            this.markers.forEach(m => m.getElement().style.display = '');
        });

        const unsubSidequests = onSidequests((data: SidequestResponse) => {
            if (!this.map.getCanvas()) return;
            data.sidequests.forEach((activity: Activity) => {
                const colour = this._activityColour(activity.type);
                const el = document.createElement('div');
                el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${colour};border:2.5px solid #fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.35);`;
                el.title = activity.description;

                const travelLine = activity.time_to_travel != null
                    ? `<div style="color:#78716c">&#x1F6A6; ${activity.time_to_travel}h travel</div>`
                    : '';
                const priceLine = activity.price === 0
                    ? 'Free'
                    : `&#x20AC;${activity.price}`;

                const popup = new mapboxgl.Popup({ offset: 12, maxWidth: '240px' }).setHTML(
                    `<div style="font-family:'Instrument Serif',serif;padding:2px 4px">
                        <div style="font-weight:700;text-transform:capitalize;color:#3d2314;margin-bottom:4px">${activity.type}</div>
                        <div style="color:#1c1917;margin-bottom:6px">${activity.description}</div>
                        <div style="color:#78716c">&#x23F1; ${activity.time_to_complete}h &nbsp;|&nbsp; ${priceLine}</div>
                        ${travelLine}
                    </div>`
                );

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([activity.longitude, activity.latitude])
                    .setPopup(popup)
                    .addTo(this.map);

                // Open popup on hover as well as click
                el.addEventListener('mouseenter', () => marker.getPopup().addTo(this.map));
                el.addEventListener('mouseleave', () => marker.getPopup().remove());

                this.sidequestMarkers.push(marker);
            });
        });

        // Unsubscribe store listeners when the map is destroyed (e.g. React StrictMode double-mount)
        this.map.once('remove', () => {
            unsubClear();
            unsubRoute();
            unsubReset();
            unsubSidequests();
        });
    }

    addMarker(place: { name: string; countryName?: string; isoCode?: string; coords: [number, number] }) {
        const marker = new mapboxgl.Marker({ color: markerColour })
            .setLngLat(place.coords)
            .addTo(this.map);

        // Hide immediately if a route is currently shown
        if (this.routeActive) marker.getElement().style.display = 'none';

        this.markers.push(marker);

        marker.getElement().addEventListener('click', () => {
            this.map.flyTo({ center: place.coords, zoom: 5 });
            const query = place.isoCode ?? place.countryName ?? place.name;
            fetchAirports(query)
                .then(airports => this._showAirports(airports))
                .catch(err => console.error('Error fetching airports:', err));
        });
    }

    private _showAirports(airports: Airport[]) {
        this.shownAirports = airports;
        this._redrawAirportMarkers();
    }

    private _redrawAirportMarkers() {
        this.airportMarkers.forEach(m => m.remove());
        this.airportMarkers = [];

        // Keep selected airports visible even when browsing a new country
        const all = [...this.shownAirports];
        if (this.departureAirport && !all.find(a => a.skyId === this.departureAirport!.skyId))
            all.push(this.departureAirport);
        if (this.destinationAirport && !all.find(a => a.skyId === this.destinationAirport!.skyId))
            all.push(this.destinationAirport);

        this.airportMarkers = addAirportMarkers(
            this.map,
            all,
            (airport) => this._selectAirport(airport),
            this.departureAirport?.skyId,
            this.destinationAirport?.skyId,
        );
    }

    private _selectAirport(airport: Airport) {
        if (!this.departureAirport) {
            this.departureAirport = airport;
        } else if (!this.destinationAirport && airport.skyId !== this.departureAirport.skyId) {
            this.destinationAirport = airport;
        } else {
            // Both already selected — reset and start again
            this.departureAirport = airport;
            this.destinationAirport = null;
        }
        this._redrawAirportMarkers();
        notifySelection(this.departureAirport, this.destinationAirport);
    }

    private _clearRoute() {
        this.routeMarkers.forEach(m => m.remove());
        this.routeMarkers = [];
        const src = this.map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
        src?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
    }

    private _clearSidequests() {
        this.sidequestMarkers.forEach(m => m.remove());
        this.sidequestMarkers = [];
    }

    private _activityColour(type: string): string {
        const map: Record<string, string> = {
            culture: '#7c3aed',
            shopping: '#db2777',
            food: '#ea580c',
            restaurant: '#ea580c',
            nature: '#16a34a',
            sport: '#0284c7',
        };
        return map[type.toLowerCase()] ?? '#d97706';
    }

    resetMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        this.airportMarkers.forEach(m => m.remove());
        this.airportMarkers = [];
        this.departureAirport = null;
        this.destinationAirport = null;
        this.shownAirports = [];
        console.log("[Map/Handler] Markers have been reset.");
    }
}