import React, { useState, useEffect } from 'react';
import { HeartPulse, ArrowRight, Shield, Navigation, Activity, Users, Zap, TrendingDown, Clock, Radio, CheckCircle } from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  { icon: Shield,     color: '#EF4444', title: 'Silent Guardian',          desc: 'Mobile G-force sensor detects crashes automatically. Auto-triggers SOS with a 10s cancel window to prevent false positives.' },
  { icon: Navigation, color: '#3B82F6', title: 'Smart Green Corridor',     desc: 'AI overrides traffic signals in real-time along the ambulance route — cutting 11 minutes off average EMS response time.' },
  { icon: Activity,   color: '#059669', title: 'VitalStream',              desc: 'Live patient telemetry streamed from the ambulance to the trauma team. Heart rate, SpO₂, BP — all before arrival.' },
  { icon: Users,      color: '#8B5CF6', title: 'Community First Responder', desc: 'Nearest trained bystanders are geo-pinged and dispatched within 60 seconds — buying critical time for the ambulance.' },
];

const IMPACT_STATS = [
  { icon: Clock,       color: '#EF4444', stat: '15 → 4 min', label: 'Response Time',          detail: 'Green Corridor slashes EMS delays by eliminating signal wait times along the route.' },
  { icon: TrendingDown,color: '#059669', stat: '73%',         label: 'Trauma Mortality ↓',     detail: 'Hospital pre-alerting with VitalStream allows trauma teams to prep before the patient arrives.' },
  { icon: Zap,         color: '#F59E0B', stat: '60s',         label: 'First Responder Dispatch',detail: 'Community responders are on-scene in under a minute — critical for cardiac events and airway management.' },
];

// Animated route SVG hero illustration
function HeroVisual() {
  const [step, setStep] = useState(0); // 0=idle 1=sos 2=route 3=arrived
  const [ambulanceX, setAmbulanceX] = useState(80);
  const [heartbeat, setHeartbeat] = useState(72);

  useEffect(() => {
    const seq = [
      () => setStep(1),
      () => setStep(2),
      () => { setStep(2); setAmbulanceX(180); },
      () => { setAmbulanceX(280); },
      () => { setAmbulanceX(380); setStep(3); },
      () => { setStep(0); setAmbulanceX(80); },
    ];
    let i = 0;
    const t = setInterval(() => {
      seq[i % seq.length]();
      i++;
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setHeartbeat(v => Math.max(65, Math.min(98, v + (Math.random() > 0.5 ? 2 : -2))));
    }, 900);
    return () => clearInterval(t);
  }, []);

  const isActive = step > 0;
  const corridorColor = step >= 2 ? '#10B981' : '#d1d5db';
  const ambulanceVisible = step >= 1;

  return (
    <div className="hero-visual-rich">

      {/* Top stat cards */}
      <div className="hero-stat-row">
        <div className="hero-stat-card">
          <div className="hero-stat-label">Response Time</div>
          <div className="hero-stat-value red"><span className="strike">15 min</span> → <span className="green">4 min</span></div>
        </div>
        <div className="hero-stat-card">
          <div className="hero-stat-label">Hospitals Connected</div>
          <div className="hero-stat-value green">5 <span style={{fontSize:'0.9rem', color:'#64748b', fontWeight:500}}>trauma centers</span></div>
        </div>
      </div>

      {/* Central animated route map */}
      <div className="hero-map-card">
        <div className="hero-map-header">
          <div className="hero-map-dot" style={{ background: isActive ? '#10B981' : '#94A3B8', boxShadow: isActive ? '0 0 8px #10B981' : 'none' }}></div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? '#059669' : '#64748b', letterSpacing: '0.5px' }}>
            {step === 0 ? 'SYSTEM READY' : step === 1 ? 'SOS RECEIVED' : step < 3 ? 'CORRIDOR ACTIVE' : 'ARRIVED'}
          </span>
          {isActive && <span className="hero-live-badge">● LIVE</span>}
        </div>

        {/* SVG road map */}
        <svg viewBox="0 0 460 130" className="hero-svg-map">
          {/* Road */}
          <rect x="40" y="58" width="380" height="14" rx="7" fill="#e2e8f0" />
          {/* Green corridor highlight */}
          <rect x="40" y="58" width={step >= 2 ? (ambulanceX > 40 ? ambulanceX - 40 : 0) : 0} height="14" rx="7" fill="#10B981" opacity="0.35"
            style={{ transition: 'width 0.6s ease' }} />
          {/* Route line */}
          <line x1="40" y1="65" x2="420" y2="65" stroke={corridorColor} strokeWidth="2.5" strokeDasharray={step >= 2 ? '0' : '8 6'}
            style={{ transition: 'stroke 0.5s' }} />

          {/* Traffic lights */}
          {[130, 230, 330].map((x, i) => (
            <g key={x}>
              <rect x={x - 8} y="42" width="16" height="24" rx="3" fill={step >= 2 ? '#10B981' : '#EF4444'} opacity="0.85"
                style={{ transition: 'fill 0.4s' }} />
              <circle cx={x} cy="50" r="4" fill="white" opacity="0.8" />
            </g>
          ))}

          {/* Accident marker */}
          {step >= 1 && (
            <g style={{ animation: 'pulse-marker 1s ease-in-out infinite' }}>
              <circle cx="40" cy="65" r="10" fill="#EF4444" opacity="0.2" />
              <circle cx="40" cy="65" r="6" fill="#EF4444" />
              <text x="40" y="69.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">!</text>
            </g>
          )}

          {/* Hospital marker */}
          <g>
            <rect x="404" y="48" width="32" height="26" rx="4" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
            <text x="420" y="65" textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="bold">H</text>
            {step === 3 && <circle cx="420" cy="45" r="5" fill="#10B981" />}
          </g>

          {/* Ambulance */}
          {ambulanceVisible && (
            <g style={{ transform: `translateX(${ambulanceX}px)`, transition: 'transform 0.6s ease' }}>
              <rect x="0" y="53" width="28" height="18" rx="4" fill="#10B981" />
              <text x="14" y="65" textAnchor="middle" fontSize="10">🚑</text>
            </g>
          )}

          {/* Labels */}
          <text x="40" y="90" textAnchor="middle" fontSize="9" fill="#94A3B8">Accident</text>
          <text x="420" y="90" textAnchor="middle" fontSize="9" fill="#94A3B8">Hospital</text>
        </svg>

        {/* Status chips */}
        <div className="hero-status-chips">
          {[
            { label: 'SOS Triggered',    done: step >= 1 },
            { label: 'Corridor Active',  done: step >= 2 },
            { label: 'Hospital Alerted', done: step >= 3 },
          ].map(c => (
            <div key={c.label} className={`hero-chip ${c.done ? 'active' : ''}`}>
              <CheckCircle size={11} /> {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stat row */}
      <div className="hero-stat-row">
        <div className="hero-stat-card compact">
          <Activity size={14} color="#059669" />
          <span className="hero-stat-label">Live Vitals</span>
          <span className="hero-stat-value green" style={{fontSize:'1rem'}}>{heartbeat} <span style={{fontSize:'0.7rem'}}>BPM</span></span>
        </div>
        <div className="hero-stat-card compact">
          <Radio size={14} color="#8B5CF6" />
          <span className="hero-stat-label">Responders</span>
          <span className="hero-stat-value" style={{color:'#8B5CF6', fontSize:'1rem'}}>3 <span style={{fontSize:'0.7rem', color:'#64748b'}}>en route</span></span>
        </div>
        <div className="hero-stat-card compact">
          <Zap size={14} color="#F59E0B" />
          <span className="hero-stat-label">Signals</span>
          <span className="hero-stat-value" style={{color:'#F59E0B', fontSize:'1rem'}}>4 <span style={{fontSize:'0.7rem', color:'#64748b'}}>cleared</span></span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onLaunch, onLaunchHUD, onLaunchSOS }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="brand">
          <div className="brand-icon">
            <HeartPulse color="#fff" size={24} />
          </div>
          <h2>Sahayta</h2>
        </div>
        <div className="nav-links">
          <span onClick={() => scrollTo('features-section')} style={{ cursor: 'pointer' }}>Features</span>
          <span onClick={() => scrollTo('impact-section')} style={{ cursor: 'pointer' }}>Impact</span>
          <button className="btn-nav" onClick={onLaunch}>Live Demo</button>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <div className="tagline">Every Second Counts.</div>
          <h1 className="hero-title">
            Strengthening Emergency Medical Services for <span className="highlight-green">Faster Response</span>
          </h1>
          <p className="hero-subtitle">
            Sahayta creates a Smart Green Corridor from the accident site to the trauma center, reducing EMS response times by up to 73% for road accident victims.
          </p>
          <div className="hero-actions" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <button className="btn-primary-large" onClick={onLaunch}>
              Dispatcher View <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large" onClick={onLaunchHUD}>
              Paramedic HUD
            </button>
            <button className="btn-primary-large" style={{background: '#EF4444', borderColor: '#EF4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)'}} onClick={onLaunchSOS}>
              Mobile SOS View
            </button>
          </div>
        </div>

        <HeroVisual />
      </main>

      {/* Features */}
      <section id="features-section" className="landing-section">
        <div className="section-header">
          <div className="tagline">Capabilities</div>
          <h2 className="section-title">Four Systems. One Mission.</h2>
          <p className="section-subtitle">
            Sahayta integrates sensor intelligence, AI routing, hospital coordination, and community response into a unified emergency platform.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div className="feature-card" key={i}>
                <div className="feature-icon" style={{ background: `${f.color}18`, border: `1px solid ${f.color}33` }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Impact */}
      <section id="impact-section" className="landing-section impact-bg">
        <div className="section-header">
          <div className="tagline">Why It Matters</div>
          <h2 className="section-title">Real-World Impact</h2>
          <p className="section-subtitle">
            India loses 150,000+ lives annually to road accidents. Most are preventable with faster EMS response. Sahayta directly addresses the systemic gaps.
          </p>
        </div>
        <div className="impact-grid">
          {IMPACT_STATS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div className="impact-card" key={i}>
                <div className="impact-icon-ring" style={{ borderColor: `${item.color}44` }}>
                  <Icon size={28} color={item.color} />
                </div>
                <div className="impact-stat" style={{ color: item.color }}>{item.stat}</div>
                <div className="impact-label">{item.label}</div>
                <p className="impact-detail">{item.detail}</p>
              </div>
            );
          })}
        </div>
        <div className="cta-row">
          <button className="btn-primary-large" onClick={onLaunch}>
            Launch Live Demo <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
