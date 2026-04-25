import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import { type Country, countries } from './lib';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function App() {
    const mapRef = useRef();
    const containerRef = useRef();

    const [highlighted, setHighlighted] = useState(true);

    const toggleHighlight = () => {
        if (highlighted) {
            mapRef.current.setStyle(import.meta.env.VITE_HIGHLIGHT_URL);
            setHighlighted(false);
        } else {
            mapRef.current.setStyle(import.meta.env.VITE_BLANK_URL);
            setHighlighted(true);
        }
    }

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: containerRef.current,
        });
        mapRef.current = map;

        map.on('load', () => {
            countries.forEach((country: Country) => {
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
          <button onClick={toggleHighlight}>
            {highlighted ? 'Show Blank Map' : 'Highlight Countries'}
          </button>
          <div id="map-container" ref={containerRef} />
        </>
    );
}

export default App;