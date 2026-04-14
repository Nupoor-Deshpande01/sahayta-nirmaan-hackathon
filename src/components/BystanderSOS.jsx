import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, AlertCircle, PhoneCall, Bot } from 'lucide-react';

export default function BystanderSOS({ onExit }) {
  const [step, setStep] = useState('idle'); // idle -> locating -> connected
  const [location, setLocation] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const videoRef = useRef(null);

  const startEmergency = () => {
    setStep('locating');
    
    // 1. Geolocation API & Google Roads API Simulation/Fetch
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
        
        try {
          if (apiKey && apiKey !== 'MOCK_KEY') {
            const res = await fetch(`https://roads.googleapis.com/v1/snapToRoads?path=${latitude},${longitude}&interpolate=true&key=${apiKey}`);
            const data = await res.json();
            if (data.snappedPoints) {
              setLocation(`Lat: ${data.snappedPoints[0].location.latitude.toFixed(4)}, Lng: ${data.snappedPoints[0].location.longitude.toFixed(4)} (Road Snapped)`);
            } else {
              setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }

        startVideoAndAI();
      }, (err) => {
        console.error("GPS Denied", err);
        setLocation("Unknown Location");
        startVideoAndAI();
      }, { enableHighAccuracy: true });
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
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column' }}>
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
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* CAMERA FEED */}
          <div style={{ position: 'relative', height: '40vh', background: '#000', overflow: 'hidden' }}>
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

          {/* CHATBOT */}
          <div style={{ flexGrow: 1, background: '#1E293B', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto' }}>
              {chatLog.map((c, i) => (
                <div key={i} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ background: '#3B82F6', borderRadius: '50%', padding: '0.4rem', flexShrink: 0 }}><Bot size={18} /></div>
                  <div style={{ background: '#334155', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.95rem' }}>{c.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Type to interact with AI..." style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #475569', background: '#0F172A', color: '#fff' }} disabled/>
              <button style={{ background: '#3B82F6', border: 'none', color: '#fff', padding: '0 1rem', borderRadius: '0.5rem' }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
