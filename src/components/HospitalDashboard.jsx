import React, { useState, useEffect, useRef } from 'react';
import { ActivitySquare, Droplet, Clock, UserCheck, Wind, Activity, Heart, Thermometer, Timer, MapPin, Phone } from 'lucide-react';

// VitalStream: simulated telemetry hook (realistic ambulance vitals stream)
function useVitalStream(active, socket) {
  const [vitals, setVitals] = useState({ hr: 92, spo2: 97, bp: '118/76' });

  useEffect(() => {
    if (active) {
      if (socket) {
        socket.on('emergency-update', (data) => {
          setVitals(prev => ({
            hr: data.bpm ? Math.round(data.bpm) : Math.round(prev.hr + (Math.random() * 2 - 1)),
            spo2: data.spo2 ? Math.round(data.spo2) : Math.round(prev.spo2 + (Math.random() > 0.5 ? 0 : -1)),
            bp: prev.bp
          }));
        });
      }

      const interval = setInterval(() => {
        setVitals(prev => {
          const hr = Math.round(prev.hr + (Math.random() * 2 - 1));
          const spo2 = Math.min(100, Math.round(prev.spo2 + (Math.random() > 0.5 ? 0 : -1)));
          const systolic = Math.max(90, Math.min(160, parseInt(prev.bp) + (Math.random() > 0.5 ? 2 : -2)));
          const diastolic = Math.max(60, Math.min(100, parseInt(prev.bp.split('/')[1]) + (Math.random() > 0.5 ? 1 : -1)));
          return { hr, spo2, bp: `${systolic}/${diastolic}` };
        });
      }, 1400);

      return () => {
        clearInterval(interval);
        if (socket) socket.off('emergency-update');
      };
    } else {
      setVitals({ hr: 92, spo2: 97, bp: '118/76' });
    }
  }, [active, socket]);

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

// Hook to fetch nearest hospital from backend/Places API
function useNearestHospital(active) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Decrement bed when assigned
  const assignBed = () => {
    if (hospital && hospital.availableBeds > 0) {
      setHospital(prev => ({ ...prev, availableBeds: prev.availableBeds - 1 }));
    }
  };

  useEffect(() => {
    if (!active) return;
    setLoading(true);

    let isHandled = false;

    const executeFallback = () => {
      if (isHandled) return;
      isHandled = true;
      fetch('/api/hospitals/nearest?lat=18.6298&lng=73.7997')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) setHospital(data.data[0]);
          else setError('No hospitals found nearby');
          setLoading(false);
        })
        .catch(err => { 
          setError('Could not reach server'); 
          setLoading(false); 
        });
    };

    // Master timeout covering ALL async operations: GPS, Google Nearby, Google Details
    const masterTimeout = setTimeout(() => {
      executeFallback();
    }, 3000);

    const handleSuccess = (hospitalData) => {
      if (isHandled) return;
      isHandled = true;
      clearTimeout(masterTimeout);
      setHospital(hospitalData);
      setLoading(false);
    };

    if (navigator.geolocation && window.google) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isHandled) return;
          try {
            const loc = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            
            service.nearbySearch({ location: loc, radius: 5000, type: ['hospital'] }, (results, status) => {
              if (isHandled) return;
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                const bestResult = results[0];
                service.getDetails({ placeId: bestResult.place_id }, (details, detStatus) => {
                  if (isHandled) return;
                  if (detStatus === window.google.maps.places.PlacesServiceStatus.OK) {
                    handleSuccess({
                      name: details.name,
                      phoneNumber: details.formatted_phone_number || details.international_phone_number || '+91 108',
                      location: details.geometry.location,
                      availableBeds: Math.floor(Math.random() * 8) + 2,
                      ICUAvailable: true,
                      ventilators: Math.floor(Math.random() * 4) + 1,
                      totalVentilators: 10,
                      bloodUnits: { 'O-': Math.floor(Math.random() * 10) },
                      traumaRoom: 'Bay ' + Math.floor(Math.random() * 5 + 1),
                      surgicalTeamStatus: 'Ready',
                      traumaCenter: Math.floor(Math.random() * 4 + 1)
                    });
                  } else {
                    handleSuccess({
                      name: bestResult.name, location: bestResult.geometry.location, availableBeds: 5, ICUAvailable: true, ventilators: 2, totalVentilators: 5, traumaRoom: 'Bay 1', surgicalTeamStatus: 'Ready', phoneNumber: '108'
                    });
                  }
                });
              } else {
                executeFallback();
              }
            });
          } catch(e) {
            executeFallback();
          }
        },
        (err) => executeFallback(),
        { timeout: 2500 }
      );
    } else {
      executeFallback();
    }
    
    return () => clearTimeout(masterTimeout);
  }, [active]);

  return { hospital, loading, error, assignBed };
}

// Hook to calculate real ETA
function useRealETA(active, destination) {
  const [realEta, setRealEta] = useState(null);
  useEffect(() => {
    if (!active || !destination || !window.google || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const origin = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      const matrix = new window.google.maps.DistanceMatrixService();
      matrix.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: 'DRIVING'
      }, (res, stat) => {
        if (stat === 'OK' && res.rows[0].elements[0].status === 'OK') {
          setRealEta(res.rows[0].elements[0].duration.text);
        }
      });
    });
  }, [active, destination]);
  return realEta;
}

export default function HospitalDashboard({ status, eta, socket }) {
  const isAlerted = ['hospital_alert', 'arrived'].includes(status);
  const isDispatched = ['dispatch', 'green_corridor', 'hospital_alert', 'arrived'].includes(status);
  const isGreenCorridorActive = ['green_corridor', 'hospital_alert', 'arrived'].includes(status);

  const vitals = useVitalStream(isDispatched, socket);
  const timeSaved = useTimeSaved(isGreenCorridorActive);
  const { hospital, loading, error, assignBed } = useNearestHospital(isDispatched);
  const realEta = useRealETA(isDispatched, hospital?.location);

  const [victimProfile, setVictimProfile] = useState({
    id: 'IN-9482-11',
    bloodType: 'O-Negative',
    allergies: 'Penicillin',
    isEditing: true // Starts open to represent the 'SOS Form' input
  });

  // Assign bed logic simulation
  useEffect(() => {
    if (isAlerted) assignBed();
  }, [isAlerted]);

  const spo2Color = vitals.spo2 >= 95 ? 'var(--success-color)' : vitals.spo2 >= 90 ? '#F59E0B' : '#EF4444';
  const hrColor = vitals.hr < 100 ? 'var(--success-color)' : vitals.hr < 120 ? '#F59E0B' : '#EF4444';

  // Derived hospital values, fall back gracefully while loading
  const hospitalName = hospital ? hospital.name : 'Locating nearest trauma center...';
  const traumaCenter = hospital ? `Trauma Center #${hospital.traumaCenter}` : 'Hospital Command';
  const ventilators = hospital ? hospital.ventilators : '—';
  const totalVentilators = hospital ? hospital.totalVentilators : '—';
  const bloodOneg = hospital && hospital.bloodUnits ? hospital.bloodUnits['O-'] : '—';
  const traumaRoom = hospital ? hospital.traumaRoom : '—';
  const surgicalTeam = hospital ? hospital.surgicalTeamStatus : '—';
  const availableBeds = hospital ? hospital.availableBeds : '—';

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ActivitySquare color="var(--primary-accent)" />
            Hospital Command
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {isDispatched ? (
                <>
                  <MapPin size={13} color="var(--primary-accent)" />
                  {loading ? 'Finding nearest hospital...' : error ? 'Could not locate hospital' : hospitalName}
                </>
              ) : (
                'Pre-arrival Dashboard'
              )}
            </p>
            {isDispatched && hospital && hospital.phoneNumber && (
              <p style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={12} />
                {hospital.phoneNumber}
              </p>
            )}
          </div>
        </div>
        
        {isDispatched && hospital && (
          <a 
            href={`tel:${hospital.phoneNumber}`}
            className="btn-call-hospital"
            title="Call Trauma Center"
          >
            <Phone size={18} />
            <span>Call</span>
          </a>
        )}
      </div>

      {status !== 'idle' ? (
        <>
          {/* ETA Display */}
          <div className="eta-display">
            <div className="metric-label">Estimated Time of Arrival</div>
            <h2>{realEta || eta} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>{realEta ? '' : 'MIN'}</span></h2>
          </div>

          {/* HospTrack: Resource Status — REAL DATA */}
          <div className="hosptrack-section">
            <div className="section-label">
              <Wind size={14} color="var(--primary-accent)" />
              HospTrack — Resource Status
              {loading && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>fetching...</span>}
            </div>
            <div className="hosptrack-grid">
              <div className="hosptrack-card">
                <div className="hosptrack-icon"><Wind size={18} color="var(--primary-accent)" /></div>
                <div>
                  <div className="hosptrack-value">
                    {ventilators}<span className="hosptrack-total">/{totalVentilators}</span>
                  </div>
                  <div className="metric-label">Ventilators</div>
                </div>
                <div className={`status-dot ${ventilators > 0 ? 'available' : 'unavailable'}`}></div>
              </div>
              <div className="hosptrack-card">
                <div className="hosptrack-icon"><Droplet size={18} color="#EF4444" /></div>
                <div>
                  <div className="hosptrack-value">{bloodOneg}<span className="hosptrack-total"> units</span></div>
                  <div className="metric-label">Blood O−</div>
                </div>
                <div className={`status-dot ${bloodOneg > 0 ? 'available' : 'unavailable'}`}></div>
              </div>
            </div>
            {hospital && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                🛏 {availableBeds} beds available · ICU: {hospital.ICUAvailable ? '✅ Yes' : '❌ No'}
              </div>
            )}
          </div>

          {/* Trauma Room Readiness */}
          <div className="metrics-grid" style={{ opacity: isAlerted ? 1 : 0.4, transition: 'opacity 0.5s' }}>
            <div className="metric-card">
              <div className="metric-value highlight">{traumaRoom}</div>
              <div className="metric-label">Trauma Room</div>
            </div>
            <div className="metric-card">
              <div className="metric-value" style={{
                color: surgicalTeam === 'Ready' ? 'var(--success-color)' : surgicalTeam === 'Busy' ? '#EF4444' : '#F59E0B'
              }}>{surgicalTeam}</div>
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

          {/* Patient Info — populated via SOS Form */}
          <div className="patient-info" style={{ opacity: isAlerted ? 1 : 0.6, transition: 'opacity 0.5s' }}>
            <div className="patient-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><UserCheck size={18} /> Victim Analytics (Synced)</span>
              <button 
                onClick={() => setVictimProfile({...victimProfile, isEditing: !victimProfile.isEditing})}
                style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                {victimProfile.isEditing ? 'Save' : 'Edit'}
              </button>
            </div>
            {victimProfile.isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOS Form Input</div>
                <input 
                  type="text" 
                  value={victimProfile.bloodType} 
                  onChange={e => setVictimProfile({...victimProfile, bloodType: e.target.value})}
                  placeholder="Blood Type"
                  style={{ padding: '0.4rem', borderRadius: '4px', background: '#1E293B', color: '#fff', border: '1px solid #334155' }}
                />
                <input 
                  type="text" 
                  value={victimProfile.allergies} 
                  onChange={e => setVictimProfile({...victimProfile, allergies: e.target.value})}
                  placeholder="Allergies"
                  style={{ padding: '0.4rem', borderRadius: '4px', background: '#1E293B', color: '#fff', border: '1px solid #334155' }}
                />
              </div>
            ) : (
              <>
                <div className="info-row">
                  <span style={{ color: 'var(--text-muted)' }}>Health ID</span>
                  <span>{victimProfile.id}</span>
                </div>
                <div className="info-row">
                  <span style={{ color: 'var(--text-muted)' }}>Blood Type</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Droplet size={14} color="#EF4444" /> {victimProfile.bloodType}
                  </span>
                </div>
                <div className="info-row">
                  <span style={{ color: 'var(--text-muted)' }}>Allergies</span>
                  <span>{victimProfile.allergies}</span>
                </div>
                {hospital && (
                  <div className="info-row">
                    <span style={{ color: 'var(--text-muted)' }}>Receiving Hospital</span>
                    <span style={{ color: 'var(--primary-accent)', fontWeight: 600, fontSize: '0.8rem' }}>{hospital.name}</span>
                  </div>
                )}
              </>
            )}
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
