import React, { useState, useEffect, useRef, useContext } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, Polyline, InfoWindow, OverlayView } from '@react-google-maps/api';
import { MapsLoadedContext } from '../App';

const mapContainerStyle = { width: '100%', height: '340px', borderRadius: '0.75rem', border: '1px solid var(--border-color)' };

// Accident origin: Pimpri-Chinchwad
const ACCIDENT_POS = { lat: 18.6298, lng: 73.7997 };
// Nearest hospital destination (Yashwantrao Chavan Memorial)
const HOSPITAL_POS = { lat: 18.6298, lng: 73.8000 };

export default function LiveTrackingMap({ routeInfo, status }) {
  const isLoaded = useContext(MapsLoadedContext);

  const [directions, setDirections] = useState(null);
  const [fallbackPath, setFallbackPath] = useState([]); // used when Directions API denied
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const mapRef = useRef(null);

  // Fetch nearest hospitals
  useEffect(() => {
    fetch(`/api/hospitals/nearest?lat=${ACCIDENT_POS.lat}&lng=${ACCIDENT_POS.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setHospitals(data.data);
          setNearestHospital(data.data[0]);
        }
      })
      .catch(err => console.error('Failed to fetch hospitals for map:', err));
  }, []);

  // Draw route from accident to nearest hospital using DirectionsService
  useEffect(() => {
    if (!isLoaded || !window.google || !nearestHospital) return;

    const [hLng, hLat] = nearestHospital.location.coordinates;
    const dest = { lat: hLat, lng: hLng };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: ACCIDENT_POS,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, routeStatus) => {
        if (routeStatus === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteStats({ distance: leg.distance.text, duration: leg.duration.text });
          }
        } else {
          console.warn('Directions failed:', routeStatus, '— using static route fallback');
          // Static fallback: draw a straight-ish path following major roads
          const [fLng, fLat] = nearestHospital.location.coordinates;
          setFallbackPath([
            ACCIDENT_POS,
            { lat: ACCIDENT_POS.lat, lng: (ACCIDENT_POS.lng + fLng) / 2 },
            { lat: fLat, lng: fLng },
          ]);
          setRouteStats({ distance: '~0.3 km', duration: '~2 min' });
        }
      }
    );
  }, [isLoaded, nearestHospital]);

  if (!isLoaded) {
    return (
      <div style={{ height: '340px', background: 'rgba(0,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🗺️</div>
        <span style={{ fontSize: '0.9rem' }}>Loading GPS Tracker...</span>
      </div>
    );
  }

  const mapCenter = ACCIDENT_POS;

  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={14}
        mapTypeId="terrain"
        onLoad={map => { mapRef.current = map; }}
        options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {/* ✅ Highlighted route from accident to hospital */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: status !== 'idle' ? '#10B981' : '#059669',
                strokeWeight: 6,
                strokeOpacity: 0.85,
              },
            }}
          />
        )}
        {/* Fallback static route when Directions API not available */}
        {!directions && fallbackPath.length > 0 && (
          <Polyline
            path={fallbackPath}
            options={{ strokeColor: '#059669', strokeWeight: 5, strokeOpacity: 0.8, geodesic: true }}
          />
        )}

        {/* 🚨 Accident site — red pulsing emoji marker */}
        <OverlayView position={ACCIDENT_POS} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div style={{ transform: 'translate(-50%, -100%)', textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontSize: '1.8rem', animation: 'pulse 1.2s ease-in-out infinite', filter: 'drop-shadow(0 2px 6px rgba(239,68,68,0.7))' }}>🚨</div>
            <div style={{ background: '#DC2626', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '-2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>ACCIDENT</div>
          </div>
        </OverlayView>

        {/* 🏥 Hospital emoji markers */}
        {hospitals.map((h) => {
          const [lng, lat] = h.location.coordinates;
          const isNearest = nearestHospital && h._id === nearestHospital._id;
          return (
            <OverlayView
              key={h._id}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{ transform: 'translate(-50%, -100%)', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedHospital(h)}
              >
                <div style={{
                  fontSize: isNearest ? '1.9rem' : '1.5rem',
                  filter: isNearest
                    ? 'drop-shadow(0 2px 8px rgba(5,150,105,0.8))'
                    : 'drop-shadow(0 1px 4px rgba(0,0,0,0.3))',
                  transition: 'font-size 0.2s',
                }}>🏥</div>
                <div style={{
                  background: isNearest ? 'var(--primary-accent)' : '#00B27A',
                  color: '#fff',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  marginTop: '-2px',
                  maxWidth: '90px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}>
                  {h.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            </OverlayView>
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
              <div style={{ color: '#111', fontSize: '0.8rem', maxWidth: '200px', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#059669' }}>{selectedHospital.name}</strong>
                <div>🛏 {selectedHospital.availableBeds} beds available</div>
                <div>💨 Ventilators: {selectedHospital.ventilators}/{selectedHospital.totalVentilators}</div>
                <div>🩸 Blood O−: {selectedHospital.bloodUnits?.['O-'] ?? '—'} units</div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ background: selectedHospital.surgicalTeamStatus === 'Ready' ? '#059669' : '#F59E0B', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {selectedHospital.surgicalTeamStatus}
                  </span>
                </div>
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Live tracker badge */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.97)', padding: '0.25rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: status !== 'idle' ? '#059669' : '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${status !== 'idle' ? '#059669' : '#ddd'}` }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: status !== 'idle' ? '#10B981' : '#999', display: 'inline-block', animation: status !== 'idle' ? 'pulse 1.2s ease-in-out infinite' : 'none' }}></span>
        Live Tracker {status !== 'idle' ? 'Active' : '—'}
      </div>

      {/* Route info badge */}
      {routeStats && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.97)', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#059669', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', gap: '1rem', border: '1px solid #059669', whiteSpace: 'nowrap' }}>
          <span>📍 {routeStats.distance}</span>
          <span>⏱ {routeStats.duration}</span>
          {nearestHospital && <span>🏥 → {nearestHospital.name.split(' ').slice(0, 2).join(' ')}</span>}
        </div>
      )}

      {/* Hospital count badge */}
      {hospitals.length > 0 && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.9)', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 700, color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
          🏥 {hospitals.length} Nearby
        </div>
      )}
    </div>
  );
}
