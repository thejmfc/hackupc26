import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
    const mapRef = useRef();
    const mapContainerRef = useRef();

    useEffect(() => {
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
        });

        return () => {
            mapRef.current.remove()
        }
    }, []);

    return (
        <>
          <div id="map-container" ref={mapContainerRef} />
        </>
    );
}

export default App;