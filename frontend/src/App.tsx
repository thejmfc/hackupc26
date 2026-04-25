import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

function App() {
    const mapRef = useRef();
    const containerRef = useRef();
    const countries = getCountries();

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: containerRef.current,
        });
        mapRef.current = map;

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

function getCountries() {
    let countries = [];
    fetch("https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1/dist/countries.geojson")
        .then(res => res.json())
        .then(geojson => {
            geojson.features.forEach(feature => {
                countries.push({
                    name: feature.properties.COUNTRY,
                    coords: feature.geometry.coordinates,
                });
            });
        })
        .catch(err => {
            console.log(`Error fetching GeoJSON: ${err}`);
        });
    return countries;
}

export default App;