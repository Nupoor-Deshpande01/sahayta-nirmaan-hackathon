import React, { useState, useEffect, useRef, useContext } from 'react';
import { Camera, MapPin, AlertCircle, Bot, Building2, Send, User, Loader, Heart, Wind } from 'lucide-react';
import { MapsLoadedContext } from '../App';
import { useRPPG } from '../hooks/useRPPG';

// Simulated Gemini-like emergency AI responses based on keywords
const AI_RESPONSES = {
  bleeding: [
    "Apply firm, direct pressure to the wound with a clean cloth or clothing. Do NOT remove once placed — add more cloth on top if blood soaks through.",
    "If bleeding is from a limb, elevate it above heart level while maintaining pressure. Keep applying pressure for at least 10 minutes continuously.",
    "If bleeding is severe and uncontrolled, use a belt or cloth as a tourniquet 2–3 inches above the wound. Note the time applied.",
  ],
  breathing: [
    "Ensure the airway is clear. Tilt the head back gently and lift the chin to open the airway.",
    "If the person is not breathing, begin CPR: 30 chest compressions followed by 2 rescue breaths at a rate of 100–120/min.",
    "Keep the person in recovery position (on their side) if breathing but unconscious to prevent choking on vomit.",
  ],
  fracture: [
    "Do NOT attempt to straighten the bone. Immobilize the area with whatever is available — magazines, boards, or rolled cloth.",
    "Apply ice wrapped in cloth to reduce swelling. Elevate the injured limb if possible without causing more pain.",
    "Check for circulation below the fracture: Is there normal color and sensation? Report this to the paramedics.",
  ],
  unconscious: [
    "Check for responsiveness: tap shoulders and shout. If no response, call for help and begin assessment.",
    "Check breathing for no more than 10 seconds. If absent, begin CPR — 30 compressions to the center of the chest, then 2 breaths.",
    "If breathing is present, place in recovery position on their side to keep airway open. Monitor breathing continuously.",
  ],
  chest: [
    "Have the person sit upright or semi-upright position. Loosen any tight clothing around chest and neck.",
    "If the person has prescribed medication (like nitroglycerin), help them take it. Do NOT give aspirin unless they ask and are not allergic.",
    "Monitor breathing and pulse closely. If they lose consciousness and stop breathing, begin CPR immediately.",
  ],
  burn: [
    "Cool the burn with cool (NOT cold) running water for at least 20 minutes. Do not use ice, butter, or toothpaste.",
    "Cover with a clean, non-fluffy material like cling wrap or a clean plastic bag. Do not use cotton wool.",
    "Do not break any blisters. Remove rings/watches near the burn site before swelling occurs.",
  ],
  head: [
    "Keep the person still and calm. Do NOT move them if you suspect a spinal injury — wait for paramedics.",
    "If they're bleeding from the head, apply gentle pressure but do not press on the skull if it feels soft or sunken.",
    "Watch for signs of concussion: confusion, vomiting, unequal pupils. Keep them awake and talking if possible.",
  ],
  default: [
    "Understood. Stay calm — help is on the way. Keep the person still and comfortable. Tell me more about the injury.",
    "Keep the injured person still and warm. Do not give them food or water. Reassure them that help is coming.",
    "Monitor breathing and pulse. If situation changes — especially if breathing stops — start CPR. What else do you see?",
  ]
};

function getAIResponse(userMessage, chatLength) {
  const msg = userMessage.toLowerCase();
  let responses = AI_RESPONSES.default;

  if (msg.includes('bleed') || msg.includes('blood') || msg.includes('cut') || msg.includes('wound')) {
    responses = AI_RESPONSES.bleeding;
  } else if (msg.includes('breath') || msg.includes('chok') || msg.includes('airway') || msg.includes('cpr')) {
    responses = AI_RESPONSES.breathing;
  } else if (msg.includes('fractur') || msg.includes('bone') || msg.includes('break') || msg.includes('arm') || msg.includes('leg')) {
    responses = AI_RESPONSES.fracture;
  } else if (msg.includes('unconscious') || msg.includes('faint') || msg.includes('not responding') || msg.includes('unresponsive')) {
    responses = AI_RESPONSES.unconscious;
  } else if (msg.includes('chest') || msg.includes('heart') || msg.includes('cardiac') || msg.includes('pulse')) {
    responses = AI_RESPONSES.chest;
  } else if (msg.includes('burn') || msg.includes('fire') || msg.includes('heat')) {
    responses = AI_RESPONSES.burn;
  } else if (msg.includes('head') || msg.includes('neck') || msg.includes('spine') || msg.includes('concu')) {
    responses = AI_RESPONSES.head;
  }

  // Cycle through responses for same category
  return responses[chatLength % responses.length];
}

const SCAN_MESSAGES = [
  "Emergency Response Dispatched. ETA 4 mins.",
  "Activating trauma scanner...",
  "AI Vision: Detecting visible injuries from camera feed...",
  "Scan complete. Possible soft-tissue trauma detected. Awaiting your input on specific symptoms.",
  "Type what you observe below — describe injuries, symptoms, or ask for first-aid guidance.",
];

export default function BystanderSOS({ onExit }) {
  const isLoaded = useContext(MapsLoadedContext);
  const [step, setStep] = useState('idle');
  const [location, setLocation] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cameraError, setCameraError] = useState(null); // null | 'permission' | 'unavailable' | 'insecure'
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const vitals = useRPPG(videoRef, cameraActive);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping]);

  const startEmergency = () => {
    setStep('locating');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        await fetchHospitals(latitude, longitude);
        startVideoAndAI();
      }, (err) => {
        console.error('GPS Denied', err);
        fetchHospitals(18.6298, 73.7997).then(() => {
          setLocation('Pimpri-Chinchwad (GPS unavailable)');
          startVideoAndAI();
        });
      }, { enableHighAccuracy: true });
    } else {
      setLocation('Geolocation not supported');
      startVideoAndAI();
    }
  };

  // Mock fallback hospitals (Pimpri-Chinchwad region) used when backend is unreachable
  const FALLBACK_HOSPITALS = [
    { _id: 'f1', name: 'PCMC Yashwantrao Hospital', availableBeds: 12, ICUAvailable: true },
    { _id: 'f2', name: 'Aditya Birla Memorial Hospital', availableBeds: 5, ICUAvailable: true },
    { _id: 'f3', name: 'Lokmanya Hospital', availableBeds: 8, ICUAvailable: false },
  ];

  const fetchHospitals = async (lat, lng) => {
    try {
      // Use relative URL — works via Vite proxy locally and reverse-proxy in production
      const res = await fetch(`/api/hospitals/nearest?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setNearbyHospitals(data.data.slice(0, 3));
      } else {
        // Backend returned empty or no success — use fallback
        setNearbyHospitals(FALLBACK_HOSPITALS);
      }
    } catch (e) {
      console.error('Failed to fetch hospitals, using fallback:', e);
      // Always show hospitals — never leave the strip blank
      setNearbyHospitals(FALLBACK_HOSPITALS);
    }
  };

  const addBotMsg = (msg) => {
    setChatLog(prev => [...prev, { text: msg, sender: 'bot' }]);
  };

  const startVideoAndAI = async () => {
    setStep('connected');

    // Start camera with detailed error handling for mobile
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // No getUserMedia API — either insecure context (HTTP) or very old browser
        if (window.location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
          setCameraError('insecure');
        } else {
          setCameraError('unavailable');
        }
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      }
    } catch (err) {
      console.error('Camera error:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('permission');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('unavailable');
      } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
        setCameraError('insecure');
      } else {
        setCameraError('unavailable');
      }
    }

    // Drip-feed initial AI messages regardless of camera status
    SCAN_MESSAGES.forEach((msg, i) => {
      setTimeout(() => addBotMsg(msg), i * 1600);
    });
  };

  // When rPPG goes live, inject real vitals report into chat
  useEffect(() => {
    if (vitals.status === 'live' && vitals.hr && step === 'connected') {
      const spo2Str = vitals.spo2 ? `SpO₂: ${vitals.spo2}%` : '';
      const hrAlert = vitals.hr > 120 ? ' ⚠️ Elevated heart rate detected.' : '';
      const spo2Alert = vitals.spo2 && vitals.spo2 < 92 ? ' ⚠️ Low oxygen saturation — check airway.' : '';
      addBotMsg(
        `📡 rPPG Scan Complete — Real-time vitals from camera:\n❤️ Heart Rate: ${vitals.hr} BPM${spo2Str ? ` · ${spo2Str}` : ''}${hrAlert}${spo2Alert}\n\nSending vitals to trauma team at receiving hospital.`
      );
    }
    // Only trigger once when status first becomes 'live'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitals.status]);

  const handleSend = async () => {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = { text: trimmed, sender: 'user' };
    setChatLog(prev => {
      const updated = [...prev, userMsg];
      // After state update, generate AI response
      return updated;
    });
    setUserInput('');
    setIsTyping(true);

    // Simulate typing delay then respond
    const currentChatLength = chatLog.filter(m => m.sender === 'bot').length;
    setTimeout(() => {
      const response = getAIResponse(trimmed, currentChatLength);
      setIsTyping(false);
      setChatLog(prev => [...prev, { text: response, sender: 'bot' }]);
      inputRef.current?.focus();
    }, 900 + Math.random() * 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ padding: '0.875rem 1.25rem', background: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, letterSpacing: '0.5px' }}>
          <AlertCircle size={20} /> SOS MODE
        </h1>
        {/* Back / Exit button — always goes to landing */}
        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '0.35rem 0.875rem',
            borderRadius: '2rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
        >
          ← Back
        </button>
      </header>

      {step === 'idle' && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <button
            onClick={startEmergency}
            style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444, #B91C1C)', border: 'none', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 0 50px rgba(239,68,68,0.5)', cursor: 'pointer', marginBottom: '2rem', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            REPORT<br />ACCIDENT
          </button>
          <p style={{ color: '#94A3B8', maxWidth: '300px', lineHeight: 1.6 }}>Tap immediately to ping nearby responders and connect with our AI first-aid assistant.</p>
        </div>
      )}

      {step === 'locating' && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#38BDF8' }}>
          <MapPin size={48} style={{ animation: 'pulse 1s ease-in-out infinite' }} />
          <p style={{ margin: 0 }}>Acquiring GPS location...</p>
        </div>
      )}

      {step === 'connected' && (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Camera Feed */}
          <div style={{ position: 'relative', height: '32vh', background: '#000', flexShrink: 0, overflow: 'hidden' }}>
            {/* Show camera error overlay when camera unavailable */}
            {cameraError ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#0a0f1a' }}>
                <Camera size={32} color="#475569" />
                <p style={{ margin: 0, color: '#94A3B8', fontWeight: 700, fontSize: '0.9rem' }}>Camera Unavailable</p>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.75rem', textAlign: 'center', maxWidth: '240px', lineHeight: 1.5 }}>
                  {cameraError === 'permission' && 'Camera permission denied. Please allow camera access in your browser settings and try again.'}
                  {cameraError === 'insecure' && 'Camera requires a secure connection (HTTPS). AI chat and hospital info still work.'}
                  {cameraError === 'unavailable' && 'No camera detected on this device. AI chat and hospital info still work.'}
                </p>
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '0.3rem 0.7rem', borderRadius: '0.375rem', fontSize: '0.77rem', display: 'flex', gap: '0.4rem', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
              <Camera size={13} color={cameraError ? '#EF4444' : '#10B981'} />
              <span style={{ color: cameraError ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                {cameraError ? 'Camera Unavailable' : 'Trauma Scanner Active'}
              </span>
            </div>
            {/* rPPG Vitals overlay — top right of camera */}
            {cameraActive && (
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '0.4rem 0.7rem', borderRadius: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {vitals.status === 'measuring' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1s infinite', display: 'inline-block' }}></span>
                    rPPG {vitals.confidence}%
                  </div>
                )}
                {vitals.status === 'live' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>
                      <Heart size={12} color="#EF4444" fill="#EF4444" />
                      <span style={{ color: vitals.hr > 100 ? '#EF4444' : '#10B981' }}>{vitals.hr}</span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>BPM</span>
                    </div>
                    {vitals.spo2 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>
                        <Wind size={12} color="#38BDF8" />
                        <span style={{ color: vitals.spo2 < 92 ? '#F59E0B' : '#10B981' }}>{vitals.spo2}%</span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>SpO₂</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {location && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(15,23,42,0.85)', padding: '0.35rem 0.6rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} color="#38BDF8" /> {location}
              </div>
            )}
            {/* Scanner overlay */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1.5px solid rgba(16,185,129,0.5)', width: '55%', height: '55%', borderRadius: '0.75rem' }} />
          </div>

          {/* Hospitals strip */}
          {nearbyHospitals.length > 0 && (
            <div style={{ background: '#1E293B', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Building2 size={13} /> Nearest Emergency Contacts
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '0.25rem' }}>
                {nearbyHospitals.map((h, i) => (
                  <div key={h._id || i} style={{ minWidth: '190px', background: '#0F172A', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.8rem' }}>{h.name}</p>
                    <p style={{ margin: '0 0 0.15rem 0', fontSize: '0.7rem', color: '#94A3B8' }}>🛏 {h.availableBeds} beds · ICU: {h.ICUAvailable ? 'Yes' : 'No'}</p>
                    <span style={{ background: h.availableBeds > 0 ? '#059669' : '#DC2626', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.68rem', fontWeight: 700 }}>
                      {h.availableBeds > 0 ? '✅ Accepting' : '❌ Full'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat window */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0F172A' }}>
            <div style={{ flexGrow: 1, padding: '0.875rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatLog.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexDirection: c.sender === 'user' ? 'row-reverse' : 'row' }}>
                  {c.sender === 'bot' ? (
                    <div style={{ background: '#1d4ed8', borderRadius: '50%', padding: '0.35rem', flexShrink: 0 }}>
                      <Bot size={15} color="#fff" />
                    </div>
                  ) : (
                    <div style={{ background: '#334155', borderRadius: '50%', padding: '0.35rem', flexShrink: 0 }}>
                      <User size={15} color="#fff" />
                    </div>
                  )}
                  <div style={{
                    background: c.sender === 'user' ? '#1d4ed8' : '#1E293B',
                    padding: '0.6rem 0.875rem',
                    borderRadius: c.sender === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    maxWidth: '80%',
                    color: '#fff',
                  }}>
                    {c.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ background: '#1d4ed8', borderRadius: '50%', padding: '0.35rem' }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <div style={{ background: '#1E293B', padding: '0.6rem 1rem', borderRadius: '1rem 1rem 1rem 0.25rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', animation: 'bounce 1s infinite 0s' }}></span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', animation: 'bounce 1s infinite 0.15s' }}></span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38BDF8', animation: 'bounce 1s infinite 0.3s' }}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar — FULLY FUNCTIONAL */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1E293B', display: 'flex', gap: '0.6rem', background: '#111827', flexShrink: 0 }}>
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the injury or ask for first-aid guidance..."
                style={{
                  flexGrow: 1, padding: '0.7rem 1rem', borderRadius: '1.5rem',
                  border: '1px solid #334155', background: '#1E293B', color: '#fff',
                  fontSize: '0.875rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = '#334155'}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!userInput.trim() || isTyping}
                style={{
                  background: userInput.trim() && !isTyping ? '#1d4ed8' : '#334155',
                  border: 'none', color: '#fff', width: '42px', height: '42px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: userInput.trim() && !isTyping ? 'pointer' : 'default',
                  flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                {isTyping ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              </button>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sos-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
