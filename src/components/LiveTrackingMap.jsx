import React, { useState, useEffect, useRef, useContext } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { MapsLoadedContext } from '../App';

const mapContainerStyle = { width: '100%', height: '320px', borderRadius: '0.5rem', border: '1px solid var(--primary-accent)' };

// Accident origin: Pimpri-Chinchwad
const ACCIDENT_POS = { lat: 18.6298, lng: 73.7997 };

export default function LiveTrackingMap({ routeInfo, status }) {
  const isLoaded = useContext(MapsLoadedContext);

  const [ambulancePos, setAmbulancePos] = useState(null);
  const [victimPos, setVictimPos] = useState(null);
  const [path, setPath] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const mapRef = useRef(null);

  // Fetch nearest hospitals to show on map
  useEffect(() => {
    fetch(`http://localhost:3000/api/hospitals/nearest?lat=${ACCIDENT_POS.lat}&lng=${ACCIDENT_POS.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setHospitals(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch hospitals for map:', err));
  }, []);

  useEffect(() => {
    if (routeInfo && routeInfo.routePolyline && isLoaded && window.google) {
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(routeInfo.routePolyline);
        const mappedPath = decodedPath.map(p => ({ lat: p.lat(), lng: p.lng() }));
        setPath(mappedPath);
        if (mappedPath.length > 0) {
          setAmbulancePos(mappedPath[0]);
          setVictimPos(mappedPath[mappedPath.length - 1]);
        }
      } catch (e) {
        console.error('Polyline decoding failed', e);
      }
    }
  }, [routeInfo, isLoaded]);

  // Animate marker along path
  useEffect(() => {
    if (status !== 'green_corridor' || path.length < 2) return;
    let currentIndex = 0;
    const timer = setInterval(() => {
      currentIndex++;
      if (currentIndex < path.length) {
        setAmbulancePos(path[currentIndex]);
      } else {
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [status, path]);

  if (!isLoaded) {
    return (
      <div style={{ height: '320px', background: 'rgba(16,185,129,0.05)', borderRadius: '0.5rem', border: '1px solid var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🗺️</div>
        <span style={{ fontSize: '0.9rem' }}>Loading GPS Tracker...</span>
      </div>
    );
  }

  const defaultCenter = path.length > 0 ? path[Math.floor(path.length / 2)] : ACCIDENT_POS;

  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={14}
        onLoad={map => { mapRef.current = map; }}
        options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false }}
      >
        {/* Route polyline */}
        {path.length > 0 && (
          <Polyline path={path} options={{ strokeColor: '#10B981', strokeWeight: 6, strokeOpacity: 0.8 }} />
        )}

        {/* Accident / victim marker */}
        {status !== 'idle' && (
          <Marker
            position={ACCIDENT_POS}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/1365/1365700.png',
              scaledSize: new window.google.maps.Size(36, 36)
            }}
            title="Accident Site"
          />
        )}

        {/* Ambulance marker (animated) */}
        {ambulancePos && (
          <Marker
            position={ambulancePos}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/1032/1032047.png',
              scaledSize: new window.google.maps.Size(40, 40)
            }}
            title="Ambulance"
          />
        )}

        {/* Victim destination marker */}
        {victimPos && (
          <Marker
            position={victimPos}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            title="Destination"
          />
        )}

        {/* Nearest hospitals on map */}
        {hospitals.map((h) => {
          const [lng, lat] = h.location.coordinates;
          return (
            <Marker
              key={h._id}
              position={{ lat, lng }}
              icon={{
                url: 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png',
                scaledSize: new window.google.maps.Size(30, 30)
              }}
              title={h.name}
              onClick={() => setSelectedHospital(h)}
            />
          );
        })}

        {/* Info window for selected hospital */}
        {selectedHospital && (() => {
          const [lng, lat] = selectedHospital.location.coordinates;
          return (
            <InfoWindow
              position={{ lat, lng }}
              onCloseClick={() => setSelectedHospital(null)}
            >
              <div style={{ color: '#111', fontSize: '0.8rem', maxWidth: '180px' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>{selectedHospital.name}</strong>
                <div>🛏 Beds: {selectedHospital.availableBeds} available</div>
                <div>💨 Ventilators: {selectedHospital.ventilators}/{selectedHospital.totalVentilators}</div>
                <div>🩸 Blood O−: {selectedHospital.bloodUnits?.['O-'] ?? '—'} units</div>
                <div>🏥 Surgical Team: {selectedHospital.surgicalTeamStatus}</div>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Badge */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.95)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold', color: status !== 'idle' ? '#10B981' : '#666', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {status !== 'idle' ? '🔴' : '⚪'} Live Tracker {status !== 'idle' ? 'Active' : '—'}
      </div>

      {/* Hospital count badge */}
      {hospitals.length > 0 && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(59,130,246,0.9)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          🏥 {hospitals.length} Hospitals Nearby
        </div>
      )}
    </div>
  );
}
