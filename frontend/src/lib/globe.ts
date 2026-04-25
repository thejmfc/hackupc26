import type { RefObject } from 'react';

import { fetchCapitals, type Capital } from './capitals';

import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

export const markerColour = '#ff0000';

export default class Globe {
    map: mapboxgl.Map;
    markers: mapboxgl.Marker[];

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
    }

    addMarker(capital: Capital, onClick?: (capital: Capital) => void) {
        console.log("[Globe/Handler] Adding marker for country: " + capital.name);
        const marker = new mapboxgl.Marker({ color: markerColour })
            .setLngLat(capital.coords)
            .addTo(this.map);
        this.markers.push(marker);

        marker.getElement().addEventListener('click', () => {
            this.map.flyTo({ center: capital.coords, zoom: 5 });
            onClick?.(capital);
        });
    }

    resetMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        console.log("[Globe/Handler] Markers have been reset.");
    }
}