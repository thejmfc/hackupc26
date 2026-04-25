import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const [isHighlighted, setIsHighlighted] = useState(false);

    const toggleHighlight = () => {
        setIsHighlighted(!isHighlighted);
    };

    useEffect(() => {
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
        });
        mapRef.current.setStyle(isHighlighted 
            ? import.meta.env.VITE_HIGHLIGHT_URL
            : import.meta.env.VITE_BLANK_URL
        );
        return () => {
            mapRef.current.remove()
        }
    }, [isHighlighted]);

    return (
        <>
          <button onClick={toggleHighlight}>Toggle Highlight</button>
          <div id="map-container" ref={mapContainerRef} />
        </>
    );
}

export default App;