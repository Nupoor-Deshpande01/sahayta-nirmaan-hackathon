import React, { useState, useEffect } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import StatusTimeline from './components/StatusTimeline';
import HospitalDashboard from './components/HospitalDashboard';
import MapVisualizer from './components/MapVisualizer';
import LandingPage from './components/LandingPage';
import { Activity } from 'lucide-react';

function App() {
  const [view, setView] = useState('landing');
  const [status, setStatus] = useState('idle');
  const [ambulancePos, setAmbulancePos] = useState({ x: '20%', y: '80%' });
  const [eta, setEta] = useState('--');

  useEffect(() => {
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
    };
  }, [status]);

  const handleSos = () => {
    setStatus('sos');
    setAmbulancePos({ x: '20%', y: '80%' });
  };

  const handleReset = () => {
    setStatus('idle');
    setAmbulancePos({ x: '20%', y: '80%' });
    setEta('--');
  };

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('dashboard')} />;
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Activity color="#fff" size={24} />
          </div>
          <div className="brand-title">
            <h1>RescueLink System</h1>
            <p>Next-Gen Emergency Medical Service Platform</p>
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

        <MapVisualizer status={status} ambulancePos={ambulancePos} />

        <aside>
          <HospitalDashboard status={status} eta={eta} />
        </aside>
      </main>
    </div>
  );
}

export default App;
