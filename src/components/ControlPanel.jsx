import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCcw, Smartphone, AlertOctagon, X, CheckCircle } from 'lucide-react';

export default function ControlPanel({ status, onSos, onReset }) {
  const isIdle = status === 'idle';

  // Silent Guardian state
  const [guardianActive, setGuardianActive] = useState(false);
  const [impactDetected, setImpactDetected] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null); // null = not counting, number = counting down
  const [sosCancelled, setSosCancelled] = useState(false);

  const startCountdown = useCallback(() => {
    setSosCountdown(10);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown === 0) {
      // Trigger actual SOS if not cancelled
      if (!sosCancelled) {
        onSos();
        setImpactDetected(false);
        setSosCountdown(null);
        setGuardianActive(false);
      }
      return;
    }
    const timer = setTimeout(() => setSosCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosCountdown, sosCancelled, onSos]);

  const handleGuardianToggle = () => {
    if (guardianActive) {
      setGuardianActive(false);
      setImpactDetected(false);
      setSosCountdown(null);
      setSosCancelled(false);
    } else {
      setGuardianActive(true);
      setImpactDetected(false);
      setSosCountdown(null);
      setSosCancelled(false);
    }
  };

  const handleSimulateImpact = () => {
    if (!isIdle || !guardianActive || impactDetected) return;
    setImpactDetected(true);
    setSosCancelled(false);
    startCountdown();
  };

  const handleCancelSos = () => {
    setSosCancelled(true);
    setSosCountdown(null);
    setImpactDetected(false);
    // Keep guardian active for next detection
  };

  // Reset guardian state when main status resets
  useEffect(() => {
    if (status === 'idle' && !isIdle) {
      setImpactDetected(false);
      setSosCountdown(null);
      setSosCancelled(false);
    }
  }, [status]);

  return (
    <div className="glass-panel control-container">
      <div>
        <h2 style={{ marginBottom: '0.5rem' }}>Emergency Control</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Simulate a real-time medical emergency to trigger the Sahayta system.
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

      {/* Silent Guardian Section */}
      <div className="guardian-section">
        <div className="guardian-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={16} color={guardianActive ? 'var(--primary-accent)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: guardianActive ? 'var(--primary-accent)' : 'var(--text-muted)' }}>
              Silent Guardian
            </span>
            <span className={`guardian-badge ${guardianActive ? 'active' : ''}`}>
              {guardianActive ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <button className="guardian-toggle" onClick={handleGuardianToggle}>
            {guardianActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {guardianActive && (
          <div className="guardian-body">
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Monitoring mobile G-force sensors. High-G impact triggers auto-SOS.
            </p>
            {!impactDetected ? (
              <button
                className="btn-simulate-impact"
                onClick={handleSimulateImpact}
                disabled={!isIdle}
              >
                <AlertOctagon size={14} />
                Simulate High-G Impact
              </button>
            ) : (
              <div className="impact-alert">
                <div className="impact-alert-top">
                  <AlertOctagon size={16} color="#EF4444" />
                  <span style={{ fontWeight: 700, color: '#EF4444' }}>HIGH-G IMPACT DETECTED</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem' }}>
                  Auto-SOS launching in <strong style={{ color: '#EF4444', fontSize: '1.1rem' }}>{sosCountdown}s</strong>
                </p>
                <div className="countdown-bar-track">
                  <div
                    className="countdown-bar-fill"
                    style={{ width: `${(sosCountdown / 10) * 100}%` }}
                  />
                </div>
                <button className="btn-cancel-sos" onClick={handleCancelSos}>
                  <X size={14} />
                  Cancel SOS (False Positive)
                </button>
              </div>
            )}
            {sosCancelled && (
              <div className="impact-cancelled">
                <CheckCircle size={14} color="var(--primary-accent)" />
                <span>SOS Cancelled. No false alarm reported.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!isIdle && (
        <button className="btn-reset" onClick={onReset}>
          <RefreshCcw size={16} />
          Reset Demo
        </button>
      )}
    </div>
  );
}
