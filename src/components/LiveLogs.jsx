import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function LiveLogs({ socket }) {
  const [logs, setLogs] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const addLog = (msg) => {
      setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
    };

    socket.on('new_sos', (data) => addLog(`[DB] Saved SOS: ID ${data._id.substring(0,6)}...`));
    socket.on('green_corridor_active', (data) => addLog(`[MAPS] Green Corridor Active: ETA ${data.routeInfo.etaMinutes} mins`));
    socket.on('ambulance_location_update', (data) => addLog(`[GPS] Ambulance ${data.ambulanceId.substring(0,4)} patching location`));

    return () => {
      socket.off('new_sos');
      socket.off('green_corridor_active');
      socket.off('ambulance_location_update');
    };
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>
        <Terminal size={18} color="var(--primary-accent)" /> Real-Time Socket.io Stream
      </h3>
      <div style={{ 
        flexGrow: 1, 
        background: '#1E293B', 
        borderRadius: '0.5rem', 
        padding: '1rem',
        color: '#A7F3D0',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        overflowY: 'auto',
        maxHeight: '150px'
      }}>
        {logs.length === 0 && <span style={{ color: '#64748B' }}>Listening for socket events...</span>}
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#94A3B8' }}>{log.time}</span> - {log.msg}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
