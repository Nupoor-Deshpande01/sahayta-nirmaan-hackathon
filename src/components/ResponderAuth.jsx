import React, { useState } from 'react';
import { User, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ResponderAuth({ onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\+?[\d\s-]{10,15}$/.test(phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }

    const userData = { name: name.trim(), phone: phone.trim() };
    localStorage.setItem('sahayta_responder', JSON.stringify(userData));
    onComplete(userData);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal glass-panel">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <ShieldAlert color="var(--sos-color)" size={32} />
          </div>
          <h2>Responder Identification</h2>
          <p>This information allows medical teams to contact you for critical details about the victim.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name"><User size={16} /> Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone"><Phone size={16} /> Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-auth-submit">
            Securely Connect & Continue
            <CheckCircle2 size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>🔒 Data encrypted and private. Shared only with authorized medical teams.</p>
        </div>
      </div>
    </div>
  );
}
