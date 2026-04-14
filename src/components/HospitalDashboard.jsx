import React, { useState, useEffect, useRef } from 'react';
import { ActivitySquare, Droplet, Clock, UserCheck, Wind, Activity, Heart, Thermometer, Timer } from 'lucide-react';

// VitalStream: simulated telemetry hook
function useVitalStream(active) {
  const [vitals, setVitals] = useState({ hr: 92, spo2: 97, bp: '118/76' });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setVitals(prev => {
          const hr = Math.max(60, Math.min(130, prev.hr + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5)));
          const spo2 = Math.max(88, Math.min(100, prev.spo2 + (Math.random() > 0.4 ? 0 : -1)));
          const systolic = Math.max(90, Math.min(160, parseInt(prev.bp) + (Math.random() > 0.5 ? 2 : -2)));
          const diastolic = Math.max(60, Math.min(100, parseInt(prev.bp.split('/')[1]) + (Math.random() > 0.5 ? 1 : -1)));
          return { hr, spo2, bp: `${systolic}/${diastolic}` };
        });
      }, 1400);
    } else {
      clearInterval(intervalRef.current);
      setVitals({ hr: 92, spo2: 97, bp: '118/76' });
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  return vitals;
}

// Time Saved counter
function useTimeSaved(active) {
  const [saved, setSaved] = useState(0);
  useEffect(() => {
    if (!active) { setSaved(0); return; }
    const interval = setInterval(() => setSaved(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [active]);
  return saved;
}

export default function HospitalDashboard({ status, eta }) {
  const isAlerted = ['hospital_alert', 'arrived'].includes(status);
  const isDispatched = ['dispatch', 'green_corridor', 'hospital_alert', 'arrived'].includes(status);
  const isGreenCorridorActive = ['green_corridor', 'hospital_alert', 'arrived'].includes(status);

  const vitals = useVitalStream(isDispatched);
  const timeSaved = useTimeSaved(isGreenCorridorActive);

  const spo2Color = vitals.spo2 >= 95 ? 'var(--success-color)' : vitals.spo2 >= 90 ? '#F59E0B' : '#EF4444';
  const hrColor = vitals.hr < 100 ? 'var(--success-color)' : vitals.hr < 120 ? '#F59E0B' : '#EF4444';

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ActivitySquare color="var(--primary-accent)" />
          Hospital Command
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Trauma Center #4 - Pre-arrival Dashboard
        </p>
      </div>

      {status !== 'idle' ? (
        <>
          {/* ETA Display */}
          <div className="eta-display">
            <div className="metric-label">Estimated Time of Arrival</div>
            <h2>{eta} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>MIN</span></h2>
          </div>

          {/* HospTrack: Resource Status */}
          <div className="hosptrack-section">
            <div className="section-label">
              <Wind size={14} color="var(--primary-accent)" />
              HospTrack — Resource Status
            </div>
            <div className="hosptrack-grid">
              <div className="hosptrack-card">
                <div className="hosptrack-icon"><Wind size={18} color="#3B82F6" /></div>
                <div>
                  <div className="hosptrack-value">3<span className="hosptrack-total">/5</span></div>
                  <div className="metric-label">Ventilators</div>
                </div>
                <div className="status-dot available"></div>
              </div>
              <div className="hosptrack-card">
                <div className="hosptrack-icon"><Droplet size={18} color="#EF4444" /></div>
                <div>
                  <div className="hosptrack-value">12<span className="hosptrack-total"> units</span></div>
                  <div className="metric-label">Blood O-</div>
                </div>
                <div className="status-dot available"></div>
              </div>
            </div>
          </div>

          {/* Trauma Room Readiness */}
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

          {/* VitalStream */}
          <div className="vitalstream-section" style={{ opacity: isDispatched ? 1 : 0.5, transition: 'opacity 0.5s' }}>
            <div className="section-label">
              <Activity size={14} color="var(--primary-accent)" style={{ animation: isDispatched ? 'pulse 1.4s ease-in-out infinite' : 'none' }} />
              VitalStream — Live Telemetry
              {isDispatched && <span className="live-badge">● LIVE</span>}
            </div>
            <div className="vitals-grid">
              <div className="vital-card">
                <Heart size={16} color={hrColor} style={{ animation: isDispatched ? 'heartbeat 0.8s ease-in-out infinite' : 'none' }} />
                <div className="vital-value" style={{ color: hrColor }}>{vitals.hr}</div>
                <div className="metric-label">BPM</div>
              </div>
              <div className="vital-card">
                <Activity size={16} color={spo2Color} />
                <div className="vital-value" style={{ color: spo2Color }}>{vitals.spo2}%</div>
                <div className="metric-label">SpO₂</div>
              </div>
              <div className="vital-card">
                <Thermometer size={16} color="#F59E0B" />
                <div className="vital-value" style={{ color: '#F59E0B' }}>{vitals.bp}</div>
                <div className="metric-label" style={{ fontSize: '0.65rem' }}>BP mmHg</div>
              </div>
            </div>
          </div>

          {/* Time Saved Counter */}
          {isGreenCorridorActive && (
            <div className="time-saved-banner">
              <Timer size={16} color="var(--primary-accent)" />
              <span>Green Corridor Active —</span>
              <strong style={{ color: 'var(--primary-accent)' }}>{timeSaved}s</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>time saved</span>
            </div>
          )}

          {/* Patient Info */}
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
