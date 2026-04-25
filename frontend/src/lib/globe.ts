import type { RefObject } from 'react';

import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export const markerColour = '#ff0000';

export default class Globe {
    map: mapboxgl.Map;
    markers: mapboxgl.Marker[];

    constructor(ref: RefObject<string | HTMLElement>) {
        this.map = new mapboxgl.Map({
            container: ref.current,
        });
        this.markers = [];
    }

    addMarker(country: GeoJSON.Country) {
        const marker = new mapboxgl.Marker({ color: markerColour })
            .setLngLat(country.coords)
            .addTo(this.map);
        this.markers.push(marker);

        marker.getElement().addEventListener('click', () => {
            this.map.flyTo({
                center: country.coords,
                zoom: 5
            });

            // TODO: show more information about this country
        });
    }

    resetMarkers() {
        this.markers.forEach(marker => marker.remove());
        console.log("[Map/Handler] Markers have been reset.");
    }
}