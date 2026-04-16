import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import StatusTimeline from './components/StatusTimeline';
import HospitalDashboard from './components/HospitalDashboard';
import LiveTrackingMap from './components/LiveTrackingMap';
import LandingPage from './components/LandingPage';
import AdminStats from './components/AdminStats';
import LiveLogs from './components/LiveLogs';
import AmbulanceNavigator from './components/AmbulanceNavigator';
import BystanderSOS from './components/BystanderSOS';
import ResponderAuth from './components/ResponderAuth';
import { Activity, PhoneCall } from 'lucide-react';
import { io } from 'socket.io-client';
import { LoadScript } from '@react-google-maps/api';

// Global Maps context — ensures only ONE Google Maps JS SDK is loaded for the entire app
export const MapsLoadedContext = createContext(false);

const MAPS_LIBRARIES = ['geometry', 'places'];
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

// Connect to backend (dynamically handles local vs production/Vercel)
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : undefined;
const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'] // Vercel mostly relies on polling
});

function App() {
  const [view, setView] = useState('landing');
  const [status, setStatus] = useState('idle');
  const [ambulancePos, setAmbulancePos] = useState({ x: '20%', y: '80%' });
  const [eta, setEta] = useState('--');
  const [routeInfo, setRouteInfo] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [responderInfo, setResponderInfo] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check for saved responder info
    const saved = localStorage.getItem('sahayta_responder');
    if (saved) {
      setResponderInfo(JSON.parse(saved));
    } else {
      setShowAuth(true);
    }

    socket.on('new_sos', (data) => console.log('🟢 [Socket] New Emergency Broadcast:', data));
    socket.on('green_corridor_active', (data) => {
       console.log('🟢 [Socket] Green Corridor Active:', data);
       setRouteInfo(data.routeInfo);
       if (data.routeInfo && data.routeInfo.etaMinutes) {
         setEta(data.routeInfo.etaMinutes.toString().padStart(2, '0'));
       }
    });
    socket.on('ambulance_location_update', (data) => console.log('🟢 [Socket] Ambulance moving:', data));

    let timeoutId;
    let etaInterval;

    if (status === 'sos') {
      timeoutId = setTimeout(() => setStatus('dispatch'), 800);
    } else if (status === 'dispatch') {
      setEta('10');
      timeoutId = setTimeout(() => {
        setStatus('green_corridor');
        setAmbulancePos({ x: '50%', y: '50%' });
      }, 1200);
    } else if (status === 'green_corridor') {
      timeoutId = setTimeout(() => {
        setStatus('hospital_alert');
        setAmbulancePos({ x: '80%', y: '50%' });
      }, 1500);
    } else if (status === 'hospital_alert') {
      timeoutId = setTimeout(() => {
        setStatus('arrived');
        setAmbulancePos({ x: '80%', y: '20%' });
        setEta('00');
      }, 1500);
    }

    if (['dispatch', 'green_corridor', 'hospital_alert'].includes(status)) {
       etaInterval = setInterval(() => {
         setEta(prev => {
           if (prev === '--') return '08';
           const num = parseInt(prev);
           return num > 1 ? `0${num - 1}`.slice(-2) : '01';
         });
       }, 500);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(etaInterval);
      socket.off('new_sos');
      socket.off('green_corridor_active');
      socket.off('ambulance_location_update');
    };
  }, [status]);

  const handleSos = async () => {
    setStatus('sos');
    setAmbulancePos({ x: '20%', y: '80%' });

    try {
      const sosRes = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: '603d2bafb9c32b50901abccd', 
          latitude: 18.6298, 
          longitude: 73.7997, 
          accidentSeverity: 'High',
          witnessName: responderInfo?.name || 'Anonymous Responder',
          witnessPhone: responderInfo?.phone || 'Unknown'
        })
      });
      const sosData = await sosRes.json();
      console.log('Backend response (SOS assigned):', sosData);

      const corridorRes = await fetch('/api/corridor', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ source: { lat: 18.6298, lng: 73.7997 }, destination: { lat: 18.6210, lng: 73.8120 } })
      });
      const corridorData = await corridorRes.json();
      console.log('Backend Corridor Route:', corridorData);
    } catch (err) {
      console.error('Failed to communicate with backend:', err);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAmbulancePos({ x: '20%', y: '80%' });
    setEta('--');
    setRouteInfo(null);
  };

  const handleAuthComplete = (data) => {
    setResponderInfo(data);
    setShowAuth(false);
  };

  return (
    // Single LoadScript at the ROOT wraps the entire app — no component-level useJsApiLoader calls
    <LoadScript
      googleMapsApiKey={MAPS_API_KEY}
      libraries={MAPS_LIBRARIES}
      onLoad={() => setMapsLoaded(true)}
      loadingElement={<div />}
    >
      <MapsLoadedContext.Provider value={mapsLoaded}>
        {showAuth && <ResponderAuth onComplete={handleAuthComplete} />}
        {view === 'landing' && (
          <LandingPage onLaunch={() => setView('dashboard')} onLaunchHUD={() => setView('navigator')} onLaunchSOS={() => setView('sos')} />
        )}

        {view === 'navigator' && (
          <AmbulanceNavigator onExit={() => setView('landing')} />
        )}

        {view === 'sos' && (
          <BystanderSOS onExit={() => setView('landing')} />
        )}

        {view === 'dashboard' && (
          <div className="app-wrapper">
            <header className="app-header">
              <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setView('landing')}
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: 'var(--text-primary)',
                    padding: '0.35rem 0.875rem',
                    borderRadius: '2rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                >
                  ← Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="brand-icon">
                    <Activity color="#10B981" size={20} strokeWidth={3} />
                  </div>
                  <div className="brand-title">
                    <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.05em', color: '#0F172A', textTransform: 'uppercase' }}>SAHAYTA</h1>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.5px' }}>EMS OPERATIONAL COMMAND</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className={`traffic-light ${status !== 'idle' ? 'green' : 'red'}`} style={{position: 'relative', top: 0, left: 0, transform: 'none'}}></div>
                <span style={{color: 'var(--text-muted)'}}>System {status !== 'idle' ? 'Active' : 'Standby'}</span>
              </div>
            </header>

            <main className="dashboard-grid">
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <ControlPanel status={status} onSos={handleSos} onReset={handleReset} />
                <StatusTimeline status={status} />
              </aside>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <LiveTrackingMap routeInfo={routeInfo} status={status} />
                  {routeInfo && (
                    <div className="glass-panel" style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--primary-accent)' }}>
                      <h4 style={{ color: 'var(--primary-accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Google_Maps_Logo_2020.svg" alt="Google Maps" style={{width: '20px'}}/>
                        Live Maps API Route Data
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span><strong>Distance:</strong> {routeInfo.distance} </span>
                        <span><strong>Optimized ETA:</strong> {routeInfo.etaMinutes} mins </span>
                      </div>
                    </div>
                  )}
                </div>
                <AdminStats />
                
                {/* Global Call Ambulance Button */}
                <div style={{ marginTop: '0.5rem' }}>
                  <a href="tel:108" style={{ 
                    background: '#DC2626', 
                    color: '#fff', 
                    width: '100%', 
                    padding: '0.95rem', 
                    textAlign: 'center', 
                    borderRadius: '0.5rem', 
                    fontWeight: 800, 
                    fontSize: '1.05rem',
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    letterSpacing: '0.5px', 
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#DC2626'}
                  >
                    <PhoneCall size={20} /> CALL AMBULANCE (108)
                  </a>
                </div>
              </div>

              <aside style={{ display: 'flex', flexDirection: 'column' }}>
                <HospitalDashboard status={status} eta={eta} socket={socket} />
                <LiveLogs socket={socket} />
              </aside>
            </main>
          </div>
        )}
      </MapsLoadedContext.Provider>
    </LoadScript>
  );
}

export default App;
