import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
    const mapRef = useRef();
    const containerRef = useRef();

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: containerRef.current,
        });

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
        mapRef.current = map;

        // Sample data: In a real app, fetch a GeoJSON of country centroids
        const countries = [
            { name: 'France', coords: [2.2137, 46.2276] },
            { name: 'Japan', coords: [138.2529, 36.2048] },
            { name: 'Brazil', coords: [-51.9253, -14.2350] }
        ];

        map.on('load', () => {
            countries.forEach((country) => {
                const btn = document.createElement('button');
                btn.className = 'country-btn';
                btn.textContent = country.name;

                btn.onclick = () => {
                    alert(`You clicked on ${country.name}`);
                    map.flyTo({ center: country.coords, zoom: 5 });
                };

                new mapboxgl.Marker(btn)
                    .setLngLat(country.coords)
                    .addTo(map);
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