import { useRef, useEffect } from 'react';

import countries, { type Country } from './lib/geojson';
import Globe from './lib/globe';

import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
    const ref = useRef('');

    useEffect(() => {
        const globe = new Globe(ref);
        globe.map.on('load', () => countries.forEach((country: Country) => globe.addMarker(country)));
        return () => globe.map.remove();
    }, []);

    return (
        <>
          <div id="map-container" ref={ref} />
        </>
    );
}

export default App;