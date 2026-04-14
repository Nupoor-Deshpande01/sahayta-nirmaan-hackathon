import React from 'react';
import { ActivitySquare, Droplet, Clock, UserCheck } from 'lucide-react';

export default function HospitalDashboard({ status, eta }) {
  const isAlerted = ['hospital_alert', 'arrived'].includes(status);
  
  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ActivitySquare color="var(--primary-accent)" /> 
        Hospital Command
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Trauma Center #4 - Pre-arrival Dashboard
      </p>

      {status !== 'idle' ? (
        <>
          <div className="eta-display">
            <div className="metric-label">Estimated Time of Arrival</div>
            <h2>{eta} <span style={{fontSize: '1.25rem', color: 'var(--text-muted)'}}>MIN</span></h2>
          </div>

          <div className="metrics-grid" style={{ opacity: isAlerted ? 1 : 0.4, transition: 'opacity 0.5s' }}>
            <div className="metric-card">
              <div className="metric-value highlight">Bay 2</div>
              <div className="metric-label">Trauma Room</div>
            </div>
            <div className="metric-card">
              <div className="metric-value" style={{ color: 'var(--success-color)' }}>Ready</div>
              <div className="metric-label">Surgical Team</div>
            </div>
          </div>

          <div className="patient-info" style={{ opacity: isAlerted ? 1 : 0.4, transition: 'opacity 0.5s' }}>
            <div className="patient-header">
              <UserCheck size={18} /> Victim Analytics (Synced)
            </div>
            <div className="info-row">
              <span style={{ color: 'var(--text-muted)' }}>Health ID</span>
              <span>IN-9482-11</span>
            </div>
            <div className="info-row">
              <span style={{ color: 'var(--text-muted)' }}>Blood Type</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Droplet size={14} color="#EF4444" /> O-Negative
              </span>
            </div>
            <div className="info-row">
              <span style={{ color: 'var(--text-muted)' }}>Allergies</span>
              <span>Penicillin</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          System on standby...
        </div>
      )}
    </div>
  );
}
