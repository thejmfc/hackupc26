import { useRef, useEffect } from 'react';

import Globe from './lib/globe';

import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
    const ref = useRef('');

    useEffect(() => {
        const globe = new Globe(ref);
        return () => globe.map.remove();
    }, []);

    return (
        <>
          <div id="map-container" ref={ref} />
        </>
    );
}

export default App;