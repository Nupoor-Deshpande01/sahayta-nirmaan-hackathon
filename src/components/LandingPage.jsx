import React from 'react';
import { HeartPulse, ArrowRight, Shield, Navigation, Activity, Users, Zap, TrendingDown, Clock } from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: Shield,
    color: '#EF4444',
    title: 'Silent Guardian',
    desc: 'Mobile G-force sensor detects crashes automatically. Auto-triggers SOS with a 10s cancel window to prevent false positives.'
  },
  {
    icon: Navigation,
    color: '#3B82F6',
    title: 'Smart Green Corridor',
    desc: 'AI overrides traffic signals in real-time along the ambulance route — cutting 11 minutes off average EMS response time.'
  },
  {
    icon: Activity,
    color: '#059669',
    title: 'VitalStream',
    desc: 'Live patient telemetry streamed from the ambulance to the trauma team. Heart rate, SpO₂, BP — all before arrival.'
  },
  {
    icon: Users,
    color: '#8B5CF6',
    title: 'Community First Responder',
    desc: 'Nearest trained bystanders are geo-pinged and dispatched within 60 seconds — buying critical time for the ambulance.'
  },
];

const IMPACT_STATS = [
  {
    icon: Clock,
    color: '#EF4444',
    stat: '15 → 4 min',
    label: 'Response Time',
    detail: 'Green Corridor slashes EMS delays by eliminating signal wait times along the route.'
  },
  {
    icon: TrendingDown,
    color: '#059669',
    stat: '73%',
    label: 'Trauma Mortality ↓',
    detail: 'Hospital pre-alerting with VitalStream allows trauma teams to prep before the patient arrives.'
  },
  {
    icon: Zap,
    color: '#F59E0B',
    stat: '60s',
    label: 'First Responder Dispatch',
    detail: 'Community responders are on-scene in under a minute — critical for cardiac events and airway management.'
  },
];

export default function LandingPage({ onLaunch }) {
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
          <h2>RescueLink</h2>
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
            RescueLink creates a Smart Green Corridor from the accident site to the trauma center, reducing EMS response times by up to 73% for road accident victims.
          </p>
          <div className="hero-actions">
            <button className="btn-primary-large" onClick={onLaunch}>
              Start Simulation <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large" onClick={() => scrollTo('impact-section')}>
              See the Impact
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card metric">
            <h3>Average Response Time</h3>
            <div className="time">
              <span className="old">15 min</span> → <span className="new">4 min</span>
            </div>
          </div>
          <div className="floating-card feature">
            <HeartPulse size={32} color="var(--primary-accent)" />
            <div>
              <h4>Smart Routing</h4>
              <p>AI-driven traffic overrides</p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features-section" className="landing-section">
        <div className="section-header">
          <div className="tagline">Capabilities</div>
          <h2 className="section-title">Four Systems. One Mission.</h2>
          <p className="section-subtitle">
            RescueLink integrates sensor intelligence, AI routing, hospital coordination, and community response into a unified emergency platform.
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

      {/* Impact Section */}
      <section id="impact-section" className="landing-section impact-bg">
        <div className="section-header">
          <div className="tagline">Why It Matters</div>
          <h2 className="section-title">Real-World Impact</h2>
          <p className="section-subtitle">
            India loses 150,000+ lives annually to road accidents. Most are preventable with faster EMS response. RescueLink directly addresses the systemic gaps.
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
