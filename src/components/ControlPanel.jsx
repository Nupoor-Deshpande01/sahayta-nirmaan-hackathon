import React from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export default function ControlPanel({ status, onSos, onReset }) {
  const isIdle = status === 'idle';

  return (
    <div className="glass-panel control-container">
      <div>
        <h2 style={{ marginBottom: '0.5rem' }}>Emergency Control</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Simulate a real-time medical emergency to trigger the RescueLink system.
        </p>
      </div>

      <button 
        className="btn-sos" 
        onClick={onSos} 
        disabled={!isIdle}
      >
        <ShieldAlert size={28} />
        {isIdle ? 'SOS - Report Accident' : 'System Activated'}
      </button>

      {!isIdle && (
        <button className="btn-reset" onClick={onReset}>
          <RefreshCcw size={16} />
          Reset Demo
        </button>
      )}
    </div>
  );
}
