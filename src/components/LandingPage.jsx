import React from 'react';
import { HeartPulse, ArrowRight } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLaunch }) {
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
          <span>Features</span>
          <span>Impact</span>
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
            RescueLink creates a Smart Green Corridor from the accident site to the trauma center, reducing EMS response times by up to 50% for road accident victims.
          </p>
          <div className="hero-actions">
            <button className="btn-primary-large" onClick={onLaunch}>
              Start Simulation <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large">
              Read the Research
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
    </div>
  );
}
