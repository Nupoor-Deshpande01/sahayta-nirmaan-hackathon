import React from 'react';
import { Map, AlertTriangle } from 'lucide-react';

export default function MapVisualizer({ status, ambulancePos }) {
  const isEmergency = status !== 'idle';
  const showAmbulance = ['dispatch', 'green_corridor', 'hospital_alert', 'arrived'].includes(status);
  const isGreenCorridor = ['green_corridor', 'hospital_alert', 'arrived'].includes(status);

  // Position for the accident
  const accidentPos = { left: '80%', top: '20%' };

  return (
    <div className="glass-panel map-container" style={{ gridColumn: '2 / 3' }}>
      <div className="map-header">
        <Map size={20} color="var(--primary-accent)" />
        <h2>Live Dispatch Map (Pimpri-Chinchwad)</h2>
      </div>

      <div className="map-grid-layer">
        {/* Roads */}
        <div className="road horizontal" style={{ top: '20%' }}></div>
        <div className="road horizontal" style={{ top: '50%' }}></div>
        <div className="road horizontal" style={{ top: '80%' }}></div>
        
        <div className="road vertical" style={{ left: '20%' }}></div>
        <div className="road vertical" style={{ left: '50%' }}></div>
        <div className="road vertical" style={{ left: '80%' }}></div>

        {/* Traffic Lights at intersections */}
        {/* Intersection 1 (50, 50) */}
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '50%', top: '50%' }}></div>
        {/* Intersection 2 (80, 50) */}
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '80%', top: '50%' }}></div>
        {/* Intersection 3 (80, 20) */}
        <div className={`traffic-light ${isGreenCorridor ? 'green' : 'red'}`} style={{ left: '80%', top: '20%', transform: 'translate(-150%, -50%)' }}></div>


        {/* Green Corridor Highlight Route */}
        {isGreenCorridor && (
            <svg style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none'}}>
               <path d="M 20% 80% L 50% 80% L 50% 50% L 80% 50% L 80% 20%" 
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

        {/* Ambulance Marker */}
        {showAmbulance && (
          <div className="map-entity marker-ambulance" style={{ left: ambulancePos.x, top: ambulancePos.y, transition: 'all 0.5s linear' }}>
            <div className="entity-pulse"></div>
            🏥
          </div>
        )}
      </div>
    </div>
  );
}
