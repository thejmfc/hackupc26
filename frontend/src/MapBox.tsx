import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com
    mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9 // starting zoom
    });
  });

  return (
    <div
      style={{ height: '100%' }}
      ref={mapContainerRef}
      className="map-container"
    />
  );
};

export default MapboxExample;