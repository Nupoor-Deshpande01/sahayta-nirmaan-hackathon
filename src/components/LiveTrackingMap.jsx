import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '0.5rem', border: '1px solid var(--primary-accent)' };
const libraries = ['geometry', 'places'];

export default function LiveTrackingMap({ routeInfo, status }) {
  const { isLoaded } = useJsApiLoader({ id: 'tracking-map', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || 'MOCK_KEY', libraries });
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [victimPos, setVictimPos] = useState(null);
  const [path, setPath] = useState([]);
  
  const mapRef = useRef(null);

  useEffect(() => {
    // If we have route data from Google API
    if (routeInfo && routeInfo.routePolyline && isLoaded && window.google) {
      // Decode standard Google Maps polylines
      // The directions API often gives "overview_polyline.points" string.
      // But we passed overview_polyline.points in mapsService as routePolyline!
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(routeInfo.routePolyline);
        const mappedPath = decodedPath.map(p => ({ lat: p.lat(), lng: p.lng() }));
        
        setPath(mappedPath);
        
        // Start ambulance at the beginning of the path
        if (mappedPath.length > 0) {
          setAmbulancePos(mappedPath[0]);
          setVictimPos(mappedPath[mappedPath.length - 1]);
        }
      } catch (e) {
        console.error("Polyline decoding failed", e);
      }
    }
  }, [routeInfo, isLoaded]);

  // Animate the marker along the path!
  useEffect(() => {
    if (status !== 'corridor_active' || path.length < 2) return;
    
    let currentIndex = 0;
    const intervalTime = 500; // Move every 500ms
    const totalPoints = path.length;

    const timer = setInterval(() => {
      currentIndex++;
      if (currentIndex < totalPoints) {
        setAmbulancePos(path[currentIndex]);
      } else {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [status, path]);

  if (!isLoaded) return <div style={{height: '300px', background: '#ccc', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Zomato-style GPS Tracker...</div>;

  const defaultCenter = path.length > 0 ? path[Math.floor(path.length / 2)] : { lat: 18.5204, lng: 73.8567 }; // Pune default

  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      <GoogleMap 
        mapContainerStyle={mapContainerStyle} 
        center={defaultCenter} 
        zoom={13}
        onLoad={map => { mapRef.current = map; }}
      >
        {path.length > 0 && (
          <Polyline path={path} options={{ strokeColor: '#10B981', strokeWeight: 6, strokeOpacity: 0.8 }} />
        )}
        
        {ambulancePos && (
          <Marker 
            position={ambulancePos} 
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/1032/1032047.png', // Ambulance Icon
              scaledSize: new window.google.maps.Size(40, 40)
            }}
          />
        )}
        
        {victimPos && (
          <Marker 
            position={victimPos} 
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Victim Alert Pin
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        )}
      </GoogleMap>
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#10B981', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        Live Tracker Active
      </div>
    </div>
  );
}
