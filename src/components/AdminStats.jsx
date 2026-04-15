import React, { useState, useEffect } from 'react';
import { Server, Activity, Ambulance } from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalSOSRequests: '--',
    activeAmbulances: '--',
    averageResponseTime: '--'
  });
  const [loading, setLoading] = useState(true);

  // Poll backend stats every 3 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Stats fetching failed", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}>
        <Server size={18} color="var(--primary-accent)" /> Live Server Stats (MongoDB)
      </h3>
      {loading ? (
        <span style={{ color: 'var(--text-muted)' }}>Connecting to backend...</span>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalSOSRequests}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total SOS</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.activeAmbulances}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Busy Units</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.averageResponseTime}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Time</div>
          </div>
        </div>
      )}
    </div>
  );
}
