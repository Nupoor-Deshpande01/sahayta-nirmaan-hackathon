import React, { useState } from 'react';
import { Map, AlertTriangle, Cross, Users } from 'lucide-react';

const FIRST_RESPONDERS = [
  { id: 'fr1', left: '68%', top: '28%', name: 'Responder A', eta: '2 min' },
  { id: 'fr2', left: '75%', top: '35%', name: 'Responder B', eta: '3 min' },
  { id: 'fr3', left: '62%', top: '22%', name: 'Responder C', eta: '4 min' },
];

export default function MapVisualizer({ status, ambulancePos }) {
  const isEmergency = status !== 'idle';
  const showAmbulance = ['dispatch', 'green_corridor', 'hospital_alert', 'arrived'].includes(status);
  const isGreenCorridor = ['green_corridor', 'hospital_alert', 'arrived'].includes(status);
  const showResponders = ['dispatch', 'green_corridor', 'hospital_alert', 'arrived'].includes(status);

  const [hoveredHospital, setHoveredHospital] = useState(false);

  // Hospital destination coordinates
  const hospitalPos = { left: '80%', top: '20%' };
  // Accident site
  const accidentPos = { left: '20%', top: '80%' };

  return (
    <div className="glass-panel map-container" style={{ gridColumn: '2 / 3' }}>
      <div className="map-header">
        <Map size={20} color="var(--primary-accent)" />
        <h2>Live Dispatch Map (Pimpri-Chinchwad)</h2>
        {showResponders && (
          <span className="responder-tag">
            <Users size={12} />
            First Responder En Route (ETA: 2 min)
          </span>
        )}
      </div>

      <div className="map-grid-layer">
        {/* Roads */}
        <div className="road horizontal" style={{ top: '20%' }}></div>
        <div className="road horizontal" style={{ top: '50%' }}></div>
        <div className="road horizontal" style={{ top: '80%' }}></div>

        <div className="road vertical" style={{ left: '20%' }}></div>
        <div className="road vertical" style={{ left: '50%' }}></div>
        <div className="road vertical" style={{ left: '80%' }}></div>

        {/* Traffic Lights */}
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '50%', top: '50%' }}></div>
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '80%', top: '50%' }}></div>
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '80%', top: '20%', transform: 'translate(-150%, -50%)' }}></div>

        {/* Green Corridor Route */}
        {isGreenCorridor && (
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
            <path
              d="M 20% 80% L 50% 80% L 50% 50% L 80% 50% L 80% 20%"
              fill="none"
              stroke="rgba(16, 185, 129, 0.4)"
              strokeWidth="6"
              className="route-path"
              style={{
                strokeDasharray: '1000',
                strokeDashoffset: '0',
                animation: 'dash 2s linear alternate infinite',
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))'
              }}
            />
          </svg>
        )}

        {/* Accident Marker */}
        {isEmergency && (
          <div className="map-entity marker-accident" style={accidentPos}>
            <div className="entity-pulse"></div>
            <AlertTriangle size={14} color="#fff" />
          </div>
        )}

        {/* Community First Responders */}
        {showResponders && FIRST_RESPONDERS.map(fr => (
          <div
            key={fr.id}
            className="map-entity marker-responder"
            style={{ left: fr.left, top: fr.top }}
            title={`${fr.name} — ETA: ${fr.eta}`}
          >
            <div className="entity-pulse responder-pulse"></div>
            <Users size={12} color="#fff" />
          </div>
        ))}

        {/* Hospital Destination with HospTrack Tooltip */}
        <div
          className="map-entity marker-hospital"
          style={hospitalPos}
          onMouseEnter={() => setHoveredHospital(true)}
          onMouseLeave={() => setHoveredHospital(false)}
        >
          <Cross size={12} color="white" />
          {hoveredHospital && (
            <div className="hospital-tooltip">
              <strong>Trauma Center #4</strong>
              <div>🫁 Ventilators: 3/5</div>
              <div>🩸 Blood O−: 12 units</div>
              <div>🛏 Beds: 4 available</div>
            </div>
          )}
        </div>

        {/* Ambulance Marker */}
        {showAmbulance && (
          <div
            className="map-entity marker-ambulance"
            style={{ left: ambulancePos.x, top: ambulancePos.y, transition: 'all 0.5s linear' }}
          >
            <div className="entity-pulse"></div>
            🚑
          </div>
        )}
      </div>
    </div>
  );
}
