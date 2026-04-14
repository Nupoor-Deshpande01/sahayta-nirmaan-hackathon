import React from 'react';
import { LocateFixed, Navigation, Activity, Hospital } from 'lucide-react';

export default function StatusTimeline({ status }) {
  const steps = [
    { id: 'sos', title: 'SOS Triggered', desc: 'Accident reported, locking coordinates.', icon: LocateFixed },
    { id: 'dispatch', title: 'Smart Dispatch', desc: 'Nearest ambulance rerouted.', icon: Navigation },
    { id: 'green_corridor', title: 'Green Corridor Active', desc: 'Traffic signals overridden.', icon: Activity },
    { id: 'hospital_alert', title: 'Hospital Pre-alerted', desc: 'Trauma team standing by.', icon: Hospital }
  ];

  const getStepState = (stepId, index) => {
    const states = ['idle', 'sos', 'dispatch', 'green_corridor', 'hospital_alert', 'arrived'];
    const currentIndex = states.indexOf(status);
    const stepIndex = index + 1; // map id index

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="glass-panel" style={{ flexGrow: 1 }}>
      <h2 style={{ marginBottom: '1rem' }}>Response Chain</h2>
      <div className="timeline">
        {steps.map((step, index) => {
          const state = getStepState(step.id, index);
          const Icon = step.icon;
          return (
            <div key={step.id} className={`timeline-step ${state}`}>
              <div className="step-icon">
                <Icon size={16} />
              </div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
