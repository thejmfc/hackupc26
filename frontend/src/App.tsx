import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

import { countries } from './lib';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function App() {
    const mapRef = useRef();
    const containerRef = useRef();

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: containerRef.current,
        });
        mapRef.current = map;

        map.on('load', () => {
            countries.forEach((country: GeoJSON.Country) => {
                const marker = new mapboxgl.Marker({ color: '#FF0000' })
                    .setLngLat(country.coords)
                    .addTo(map);

                marker.getElement().addEventListener('click', () => {
                    alert(`You clicked on ${country.name}`);
                    map.flyTo({ center: country.coords, zoom: 5 });
                });
            });
        });

        return () => map.remove();
    }, []);

    return (
        <>
          <div id="map-container" ref={containerRef} />
        </>
    );
}

export default App;