import type { RefObject } from 'react';

import { fetchCapitals } from './capitals';
import { fetchAirports, addAirportMarkers, type Airport } from '../components/Airport';
import { notifySelection, onClear } from './airportStore';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export const markerColour = '#ff0000';

export default class Globe {
    map: mapboxgl.Map;
    markers: mapboxgl.Marker[];

    private airportMarkers: mapboxgl.Marker[] = [];
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
            fetchCapitals()
                .then(capitals => capitals.forEach(c => this.addMarker(c)))
                .catch(err => console.error('Error fetching capitals:', err));
        });

        onClear(() => {
            this.departureAirport = null;
            this.destinationAirport = null;
            this._redrawAirportMarkers();
        });
    }

    addMarker(place: { name: string; countryName?: string; isoCode?: string; coords: [number, number] }) {
        const marker = new mapboxgl.Marker({ color: markerColour })
            .setLngLat(place.coords)
            .addTo(this.map);
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