import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { ShieldAlert, Radio, Activity, Navigation2, Zap, ArrowLeft } from 'lucide-react';

const mapContainerStyle = { width: '100vw', height: '100vh' };
// Standard dark mode theme for reduction of eye strain
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }]},
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }]},
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
];

export default function AmbulanceNavigator({ onExit }) {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || 'MOCK_KEY' });
  const [center, setCenter] = useState({ lat: 18.6298, lng: 73.7997 }); // Mock start
  const [directions, setDirections] = useState(null);
  const [pingStatus, setPingStatus] = useState('');
  
  // Simulated IoT Telemetry
  const [vitals, setVitals] = useState({ hr: 142, spo2: 94 });
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => ({
        hr: Math.max(100, Math.min(160, prev.hr + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4))),
        spo2: Math.max(88, Math.min(96, prev.spo2 + (Math.random() > 0.4 ? 0 : -1)))
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // 1. Simulate real-time tracking (watchPosition)
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.latitude });
      }, (err) => console.log('GPS Error', err), { enableHighAccuracy: true });
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Fetch glowing blue route using Directions API
  useEffect(() => {
    if (!isLoaded) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: center,
        destination: { lat: 18.6210, lng: 73.8120 }, // mock victim
        travelMode: window.google.maps.TravelMode.DRIVING,
        // In full impl, routingPreference: TRAFFIC_AWARE_OPTIMAL goes via Routes API.
        // Google Maps JS SDK falls back to standard optimal paths. 
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      }
    );
  }, [isLoaded]); // Removing center to avoid constant rerouting for this demo

  // 3. Traffic Pre-emption Button
  const handleGreenLight = async () => {
    setPingStatus('Pinging traffic nodes...');
    try {
      const res = await fetch('http://localhost:3000/api/traffic/green-light', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: center.lat, lng: center.lng, heading: 90 })
      });
      const data = await res.json();
      setPingStatus(data.message || 'Access Granted');
      setTimeout(() => setPingStatus(''), 4000);
    } catch (e) {
      setPingStatus('Error pinging nodes. Fallback active.');
    }
  };

  if (!isLoaded) return <div style={{background: '#000', height:'100vh', color: '#059669', display:'flex', alignItems:'center', justifyContent:'center'}}>Initializing GPS Systems...</div>;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* MAP RENDERER */}
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={15} options={{ styles: darkMapStyle, disableDefaultUI: true }}>
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: { strokeColor: '#3B82F6', strokeOpacity: 0.9, strokeWeight: 8 }, // Thick blue line
              suppressMarkers: false
            }}
          />
        )}
        
        <OverlayView position={center} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div style={{transform: 'translate(-50%, -50%)', width: '40px', height: '40px', background: 'rgba(5, 150, 105, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Navigation2 color="#10B981" fill="#10B981" size={24} style={{transform: 'rotate(45deg)'}} />
          </div>
        </OverlayView>
      </GoogleMap>

      {/* PANIC OVERLAY SIDEBAR */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderRight: '1px solid #1E293B', padding: '1.5rem', color: '#fff', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer' }} onClick={onExit}>
          <ArrowLeft size={20} color="#94A3B8" /> <span style={{color: '#94A3B8'}}>Exit HUD</span>
        </div>

        <h2 style={{color: '#EF4444', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><ShieldAlert /> CODE TRAUMA</h2>
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{margin: '0 0 0.5rem 0', color: '#FCHBD'}}><strong>Victim Details</strong></p>
          <p style={{margin: 0, fontSize: '0.9rem', color: '#fff'}}>Blood Type: <span style={{color:'#EF4444', fontWeight:'bold'}}>O-Negative</span></p>
          <p style={{margin: '0.2rem 0', fontSize: '0.9rem', color: '#AAA'}}>Allergies: Penicillin</p>
        </div>

        {/* MOCK PRE-ARRIVAL VITALS */}
        <div style={{ padding: '1rem', background: 'rgba(5, 150, 105, 0.1)', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid rgba(5, 150, 105, 0.3)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981' }}><Activity size={18}/> Simulated Apple Watch Telemetry</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{color: '#94A3B8', fontSize: '0.9rem'}}>Heart Rate</span>
            <span style={{fontWeight: 'bold', color: '#EF4444'}}>{vitals.hr} BPM</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{color: '#94A3B8', fontSize: '0.9rem'}}>SpO2</span>
            <span style={{fontWeight: 'bold', color: vitals.spo2 < 92 ? '#EF4444' : '#fff'}}>{vitals.spo2}%</span>
          </div>
        </div>

        <div style={{flexGrow: 1}}></div>

        {/* TRAFFIC PRE-EMPTION BUTTON */}
        <button 
          onClick={handleGreenLight}
          style={{ padding: '1rem', background: '#3B82F6', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
          <Zap size={20} /> Traffic Pre-emption
        </button>
        {pingStatus && <p style={{color: '#60A5FA', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem'}}>{pingStatus}</p>}
      </div>

    </div>
  );
}
