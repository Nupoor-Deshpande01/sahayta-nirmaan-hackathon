import React, { useState, useEffect, useContext, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, Polyline } from '@react-google-maps/api';
import {
  ShieldAlert, Activity, Navigation2, Zap, ArrowLeft,
  Heart, Wind, Droplet, AlertTriangle, MapPin, Camera, Wifi
} from 'lucide-react';
import { MapsLoadedContext } from '../App';
import { useRPPG } from '../hooks/useRPPG';

const mapContainerStyle = { width: '100%', height: '100%' };
const ACCIDENT_POS = { lat: 18.6298, lng: 73.7997 };
const HOSPITAL_POS  = { lat: 18.6298, lng: 73.8000 };

// Clean light map style — professional, clinical feel
const lightMapStyle = [
  { featureType: 'all',      elementType: 'geometry.fill', stylers: [{ color: '#f5f5f0' }] },
  { featureType: 'road',     elementType: 'geometry',      stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'road.highway', elementType: 'geometry',  stylers: [{ color: '#c5c5c5' }] },
  { featureType: 'water',    elementType: 'geometry',      stylers: [{ color: '#cde8f0' }] },
  { featureType: 'poi',      elementType: 'labels',        stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',  elementType: 'labels',        stylers: [{ visibility: 'off' }] },
];


export default function AmbulanceNavigator({ onExit }) {
  const isLoaded = useContext(MapsLoadedContext);
  const [center]      = useState(ACCIDENT_POS);
  const [directions, setDirections] = useState(null);
  const [fallbackPath, setFallbackPath] = useState([]);
  const [pingStatus, setPingStatus] = useState('');
  const [eta, setEta]               = useState('—');
  const [distance, setDistance]     = useState('—');

  // Hidden video element for rPPG camera sampling
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const vitals = useRPPG(videoRef, cameraActive);

  // Start camera for rPPG on mount
  useEffect(() => {
    let stream;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: 320, height: 240 } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setCameraActive(true);
        }
      })
      .catch(err => console.warn('[rPPG] Camera not available for vitals:', err));
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    };
  }, []);

  // Fetch route to nearest hospital
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      { origin: ACCIDENT_POS, destination: HOSPITAL_POS, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setEta(leg.duration.text);
            setDistance(leg.distance.text);
          }
        } else {
          // Fallback static path when Directions API not enabled
          setFallbackPath([ACCIDENT_POS, { lat: (ACCIDENT_POS.lat + HOSPITAL_POS.lat)/2, lng: (ACCIDENT_POS.lng + HOSPITAL_POS.lng)/2 }, HOSPITAL_POS]);
          setEta('~2 min'); setDistance('~0.3 km');
        }
      }
    );
  }, [isLoaded]);

  const handleGreenLight = async () => {
    setPingStatus('Requesting priority clearance...');
    try {
      const res = await fetch('/api/traffic/green-light', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: center.lat, lng: center.lng, heading: 90 }),
      });
      const data = await res.json();
      setPingStatus(data.message || 'Green Corridor Granted ✓');
    } catch {
      setPingStatus('Corridor Active (Local Override)');
    }
    setTimeout(() => setPingStatus(''), 4000);
  };

  const hrBad   = vitals.hr   != null && vitals.hr > 150;
  const spo2Bad = vitals.spo2 != null && vitals.spo2 < 92;
  const isLive  = vitals.status === 'live';
  const isMeasuring = vitals.status === 'measuring';

  const sidebarStyle = {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '300px',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    boxShadow: '2px 0 16px rgba(0,0,0,0.08)',
    padding: '0',
    color: '#1e293b',
    display: 'flex', flexDirection: 'column',
    zIndex: 10,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  };

  if (!isLoaded) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#059669', fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <Activity size={20} style={{ marginRight: '0.5rem' }} /> Initializing Navigation...
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Hidden video element for rPPG sampling */}
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />

      {/* MAP */}
      <div style={{ position: 'absolute', left: '300px', right: 0, top: 0, bottom: 0 }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          options={{ styles: lightMapStyle, disableDefaultUI: true, zoomControl: true }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#059669', strokeWeight: 7, strokeOpacity: 0.9 } }}
            />
          )}
          {!directions && fallbackPath.length > 0 && (
            <Polyline path={fallbackPath} options={{ strokeColor: '#059669', strokeWeight: 6, strokeOpacity: 0.85, geodesic: true }} />
          )}
          {/* Accident site */}
          <Marker
            position={ACCIDENT_POS}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12, fillColor: '#EF4444', fillOpacity: 1,
              strokeColor: '#fff', strokeWeight: 3,
            }}
            title="Accident Site"
          />
          {/* Hospital */}
          <Marker
            position={HOSPITAL_POS}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 9, fillColor: '#059669', fillOpacity: 1,
              strokeColor: '#fff', strokeWeight: 2, rotation: 180,
            }}
            title="Receiving Hospital"
          />
        </GoogleMap>
      </div>

      {/* SIDEBAR */}
      <div style={sidebarStyle}>

        {/* Header bar */}
        <div style={{ background: '#1e293b', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="#EF4444" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.5px' }}>PARAMEDIC HUD</span>
          </div>
          <button onClick={onExit} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={13} /> Exit
          </button>
        </div>

        {/* Incident badge */}
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={15} color="#DC2626" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626', letterSpacing: '0.5px' }}>CODE TRAUMA — ACTIVE</span>
        </div>

        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto', flexGrow: 1 }}>

          {/* Route info */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.625rem', padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation2 size={12} /> Route to Hospital
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', lineHeight: 1 }}>{eta}</div>
                <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px' }}>ETA</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', lineHeight: 1 }}>{distance}</div>
                <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px' }}>Distance</div>
              </div>
            </div>
          </div>

          {/* Patient vitals */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.625rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.6rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="#059669" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Live Patient Vitals</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px',
                color: isLive ? '#10b981' : isMeasuring ? '#F59E0B' : '#94a3b8' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? '#10b981' : isMeasuring ? '#F59E0B' : '#94a3b8',
                  display: 'inline-block', animation: (isLive || isMeasuring) ? 'pulse 1.2s infinite' : 'none' }}></span>
                {isLive ? 'rPPG LIVE' : isMeasuring ? `MEASURING ${vitals.confidence}%` : 'CAMERA OFF'}
              </span>
            </div>
            {/* Confidence progress bar */}
            {isMeasuring && (
              <div style={{ height: '2px', background: '#e2e8f0' }}>
                <div style={{ height: '100%', background: '#F59E0B', width: `${vitals.confidence}%`, transition: 'width 0.5s' }} />
              </div>
            )}
            <div style={{ padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {/* HR */}
              <div style={{ textAlign: 'center' }}>
                <Heart size={16} color={hrBad ? '#EF4444' : '#059669'} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: hrBad ? '#EF4444' : '#1e293b', lineHeight: 1 }}>
                  {isLive ? vitals.hr : isMeasuring ? '…' : '—'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>BPM</div>
                {hrBad && <div style={{ fontSize: '0.6rem', color: '#EF4444', fontWeight: 700 }}>HIGH</div>}
              </div>
              {/* SpO2 */}
              <div style={{ textAlign: 'center', borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9' }}>
                <Wind size={16} color={spo2Bad ? '#F59E0B' : '#059669'} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: spo2Bad ? '#F59E0B' : '#1e293b', lineHeight: 1 }}>
                  {isLive && vitals.spo2 != null ? `${vitals.spo2}%` : isMeasuring ? '…' : '—'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>SpO₂</div>
                {spo2Bad && <div style={{ fontSize: '0.6rem', color: '#F59E0B', fontWeight: 700 }}>LOW</div>}
              </div>
              {/* BP */}
              <div style={{ textAlign: 'center' }}>
                <Droplet size={16} color="#3b82f6" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: isLive ? '1.1rem' : '1.4rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                  {isLive ? vitals.bp : isMeasuring ? '…' : '—'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>mmHg</div>
              </div>
            </div>
          </div>

          {/* Victim info */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.625rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.6rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Patient Record</span>
            </div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Blood Type', value: 'O-Negative', color: '#DC2626' },
                { label: 'Allergies',  value: 'Penicillin',  color: '#92400e' },
                { label: 'Health ID',  value: 'IN-9482-11',   color: '#334155' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.625rem', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} color="#2563EB" />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Receiving Facility</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af', marginTop: '1px' }}>Yashwantrao Chavan Memorial</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            onClick={handleGreenLight}
            style={{ width: '100%', padding: '0.85rem', background: '#059669', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#047857'}
            onMouseLeave={e => e.currentTarget.style.background = '#059669'}
          >
            <Zap size={17} /> Request Traffic Priority
          </button>
          {pingStatus && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
              ✓ {pingStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
