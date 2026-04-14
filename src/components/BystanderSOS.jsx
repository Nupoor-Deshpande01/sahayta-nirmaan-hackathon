import React, { useState, useEffect, useRef, useContext } from 'react';
import { Camera, MapPin, AlertCircle, PhoneCall, Bot, Building2 } from 'lucide-react';
import { MapsLoadedContext } from '../App';


export default function BystanderSOS({ onExit }) {
  const isLoaded = useContext(MapsLoadedContext);
  const [step, setStep] = useState('idle');
  const [location, setLocation] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const videoRef = useRef(null);

  const startEmergency = () => {
    setStep('locating');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        // Fetch Nearby Hospitals from our backend
        try {
          const res = await fetch(`http://localhost:3000/api/hospitals/nearest?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          if (data.success && data.data) {
            setNearbyHospitals(data.data.slice(0, 3));
          }
        } catch (e) {
          console.error('Failed to fetch hospitals:', e);
        }

        startVideoAndAI();
      }, (err) => {
        console.error('GPS Denied', err);
        // Fallback: use hardcoded Pimpri-Chinchwad coords
        fetch('http://localhost:3000/api/hospitals/nearest?lat=18.6298&lng=73.7997')
          .then(r => r.json())
          .then(data => { if (data.success) setNearbyHospitals(data.data.slice(0, 3)); })
          .catch(() => {});
        setLocation('Pimpri-Chinchwad (GPS unavailable)');
        startVideoAndAI();
      }, { enableHighAccuracy: true });
    } else {
      setLocation('Geolocation not supported');
      startVideoAndAI();
    }
  };

  const startVideoAndAI = async () => {
    setStep('connected');
    addBotMsg("Emergency Response Dispatched. ETA 4 mins.");
    
    // 2. MediaDevices API for camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Mock AI Scanning
      setTimeout(() => addBotMsg("Activating trauma scanner..."), 1500);
      setTimeout(() => addBotMsg("Scanning detected: Heavy lower extremity bleeding."), 4000);
      setTimeout(() => addBotMsg("CRITICAL INSTRUCTION: Get a clean cloth and apply heavy, direct pressure to the upper thigh immediately."), 5500);
    } catch (err) {
      console.error("Camera access denied", err);
      addBotMsg("Camera access blocked. Describe the injuries below.");
    }
  };

  const addBotMsg = (msg) => {
    setChatLog(prev => [...prev, { text: msg, sender: 'bot' }]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '1rem', background: '#EF4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle /> SOS MODE
        </h1>
        <button onClick={onExit} style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '0.25rem' }}>Cancel</button>
      </header>

      {step === 'idle' && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <button 
            onClick={startEmergency}
            style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444, #B91C1C)', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 0 50px rgba(239,68,68,0.5)', cursor: 'pointer', marginBottom: '2rem' }}>
            REPORT ACCIDENT
          </button>
          <p style={{ color: '#94A3B8' }}>Tap immediately to ping nearby responders and connect with our AI First-Aid assistant.</p>
        </div>
      )}

      {step === 'locating' && (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
          <MapPin size={48} className="pulse" />
          <p style={{marginLeft: '1rem'}}>Acquiring GPS and Snapping to Road...</p>
        </div>
      )}

      {step === 'connected' && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '0px' }}>
          
          <div style={{ position: 'relative', height: '35vh', background: '#000', flexShrink: 0, overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Camera size={14} color="#10B981"/> Trauma Scanner Active
            </div>
            {location && (
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(15,23,42,0.8)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>
                <MapPin size={12} style={{marginRight:'0.25rem'}}/> {location}
              </div>
            )}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(16, 185, 129, 0.5)', width: '60%', height: '60%', borderRadius: '1rem', backgroundImage: 'linear-gradient(transparent 50%, rgba(16, 185, 129, 0.1) 50%)', backgroundSize: '100% 4px' }} className="scanner-line"></div>
          </div>

          {/* Dynamic Content Panel Area */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* NEARBY HOSPITALS PANEL */}
            {nearbyHospitals.length > 0 && (
              <div style={{ background: '#1E293B', padding: '1rem', borderBottom: '1px solid #334155', flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} /> Nearest Emergency Contacts
                </h3>
                <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                  {nearbyHospitals.map((h, i) => (
                    <div key={h._id || i} style={{ minWidth: '220px', background: '#0F172A', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{h.name}</p>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#94A3B8' }}>🛏 {h.availableBeds} beds · ICU: {h.ICUAvailable ? 'Yes' : 'No'}</p>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#94A3B8' }}>💨 {h.ventilators}/{h.totalVentilators} ventilators · Team: {h.surgicalTeamStatus}</p>
                      <span style={{ background: h.availableBeds > 0 ? '#10B981' : '#EF4444', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {h.availableBeds > 0 ? '✅ Accepting Patients' : '❌ Full'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHATBOT */}
            <div style={{ flexGrow: 1, background: '#0F172A', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto' }}>
                {chatLog.map((c, i) => (
                  <div key={i} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ background: '#3B82F6', borderRadius: '50%', padding: '0.4rem', flexShrink: 0 }}><Bot size={18} color="#fff" /></div>
                    <div style={{ background: '#334155', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.95rem', lineHeight: '1.4' }}>{c.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem', background: '#1E293B', flexShrink: 0 }}>
                <input type="text" placeholder="Type to interact with AI..." style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #475569', background: '#0F172A', color: '#fff' }} disabled/>
                <button style={{ background: '#3B82F6', border: 'none', color: '#fff', padding: '0 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'not-allowed' }}>Send</button>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
