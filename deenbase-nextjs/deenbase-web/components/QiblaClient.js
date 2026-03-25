'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../app/Shell';

// ─── Haversine qibla (always works, offline) ─────────────────────
function calcQibla(lat, lng) {
  const ML = 21.4225, MLo = 39.8262;
  const dL = (MLo - lng) * Math.PI / 180;
  const l1 = lat * Math.PI / 180, l2 = ML * Math.PI / 180;
  const y = Math.sin(dL) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dL);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function QiblaClient() {
  const toast = useToast();
  const [qiblaDir, setQiblaDir] = useState(null);      // bearing to Mecca (0-360)
  const [heading, setHeading] = useState(0);          // device compass heading
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('Tap to start compass');
  const [error, setError] = useState('');
  const [aligned, setAligned] = useState(false);
  const [compassActive, setCompassActive] = useState(false);
  const [city, setCity] = useState('');

  const headingRef = useRef(0);
  const qiblaDirRef = useRef(null);
  const animFrame = useRef(null);
  const needleRef = useRef(null);

  // Update needle rotation via RAF for smooth animation
  const updateNeedle = useCallback(() => {
    if (needleRef.current && qiblaDirRef.current !== null) {
      const rot = qiblaDirRef.current - headingRef.current;
      needleRef.current.style.transform = `rotate(${rot}deg)`;
      // Check alignment
      const diff = ((rot % 360) + 360) % 360;
      const isAligned = diff < 6 || diff > 354;
      setAligned(isAligned);
    }
    animFrame.current = requestAnimationFrame(updateNeedle);
  }, []);

  // Start the animation loop
  useEffect(() => {
    animFrame.current = requestAnimationFrame(updateNeedle);
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [updateNeedle]);

  // Auto-start: get location on mount
  useEffect(() => {
    autoGetLocation();
  }, []);

  function autoGetLocation() {
    if (!navigator.geolocation) {
      setStatus('Geolocation unavailable. Use city search.');
      return;
    }
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: la, longitude: lo } = pos.coords;
        setCoords({ lat: la, lng: lo });
        const dir = calcQibla(la, lo);
        setQiblaDir(dir);
        qiblaDirRef.current = dir;
        setStatus(`${dir.toFixed(1)}° from North`);
        // Also verify with API
        fetch(`/api/qibla?lat=${la}&lng=${lo}`)
          .then(r => r.json())
          .then(d => {
            if (d.direction) { setQiblaDir(d.direction); qiblaDirRef.current = d.direction; }
          })
          .catch(() => { });
      },
      (err) => {
        setStatus('Location denied. Search city below.');
        setError('Allow location access for automatic Qibla direction.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // ─── iOS 13+ requires user gesture to request orientation permission
  async function requestCompass() {
    if (compassActive) return;

    const DevOrient = window.DeviceOrientationEvent;

    // iOS 13+ permission required
    if (typeof DevOrient?.requestPermission === 'function') {
      try {
        const permission = await DevOrient.requestPermission();
        if (permission === 'granted') {
          startListening();
          toast('Compass active');
        } else {
          setError('Compass permission denied. Enable in iOS Settings > Safari.');
        }
      } catch (e) {
        setError('Could not request compass permission: ' + e.message);
      }
      return;
    }

    // Android / desktop — no permission needed
    if (window.DeviceOrientationEvent || window.DeviceMotionEvent) {
      startListening();
      toast('Compass active');
    } else {
      setError('No orientation sensor found on this device.');
    }
  }

  function startListening() {
    setCompassActive(true);
    setStatus(qiblaDirRef.current
      ? `${qiblaDirRef.current.toFixed(1)}° — rotate until gold needle points right`
      : 'Compass active — waiting for direction…');

    // Smoothing state
    let smoothHeading = 0;
    let lastHeading = null;

    const handler = (e) => {
      let raw = null;

      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        // iOS: absolute magnetic north heading (already corrected)
        raw = e.webkitCompassHeading;
      } else if (e.absolute === true && e.alpha !== null) {
        // Android absolute: convert alpha to compass heading
        raw = (360 - e.alpha) % 360;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android relative: use alpha as heading (less accurate without absolute)
        raw = (360 - e.alpha) % 360;
      }

      if (raw === null || isNaN(raw)) return;

      // Smooth with low-pass filter to reduce jitter
      if (lastHeading === null) {
        smoothHeading = raw;
      } else {
        // Handle wrap-around (0°/360° boundary)
        let diff = raw - smoothHeading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        smoothHeading += diff * 0.15; // alpha = 0.15 for smoothing
        smoothHeading = ((smoothHeading % 360) + 360) % 360;
      }
      lastHeading = raw;
      headingRef.current = smoothHeading;
      setHeading(Math.round(smoothHeading));
    };

    // Listen to both — absolute takes priority on Android
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);

    // Cleanup stored
    window._qiblaHandler = handler;
  }

  async function searchCity() {
    if (!city.trim()) return;
    setStatus('Searching…');
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await r.json();
      if (!data.length) { setError('City not found. Try a different name.'); return; }
      const la = parseFloat(data[0].lat), lo = parseFloat(data[0].lon);
      setCoords({ lat: la, lng: lo });
      const dir = calcQibla(la, lo);
      setQiblaDir(dir); qiblaDirRef.current = dir;
      setStatus(`${dir.toFixed(1)}° from North · ${data[0].display_name.split(',')[0]}`);
      setError('');
      // Verify with API
      fetch(`/api/qibla?lat=${la}&lng=${lo}`).then(r => r.json()).then(d => { if (d.direction) { setQiblaDir(d.direction); qiblaDirRef.current = d.direction; } }).catch(() => { });
    } catch { setError('Network error.'); }
  }

  // Needle rotation in degrees
  const needleRot = qiblaDir !== null ? qiblaDir - heading : 0;
  const RING = 220;

  return (
    <div>
      <div className="page-header"><h1>Qibla Direction</h1></div>
      <div className="page-body">

        <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
          {/* Instruction */}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.5 }}>
            {compassActive
              ? 'Rotate phone until the gold needle points upward'
              : 'Tap the compass to activate the live sensor'}
          </div>

          {/* Compass */}
          <div
            onClick={requestCompass}
            style={{
              width: RING, height: RING, borderRadius: '50%',
              border: '2px solid var(--brd2)',
              background: 'radial-gradient(circle at 35% 35%,var(--surf2),var(--surf3))',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '14px auto 12px', cursor: 'pointer', userSelect: 'none',
              boxShadow: `0 0 0 10px var(--acc4),inset 0 0 30px rgba(0,0,0,.3)${compassActive ? ',0 0 20px rgba(196,164,74,.15)' : ''}`,
              transition: 'box-shadow .3s',
            }}
          >
            {/* Cardinal labels */}
            {[['N', { top: 10 }], ['S', { bottom: 10 }], ['E', { right: 14 }], ['W', { left: 14 }]].map(([l, s]) => (
              <span key={l} style={{ position: 'absolute', fontSize: '9.5px', color: 'var(--muted)', fontWeight: 700, ...s }}>{l}</span>
            ))}

            {/* Kaaba */}
            <span style={{ position: 'absolute', fontSize: 22, zIndex: 3, pointerEvents: 'none' }}>🕋</span>

            {/* Needle wrapper — rotates to point at Qibla */}
            <div
              ref={needleRef}
              style={{
                position: 'absolute', width: '100%', height: '100%',
                transition: 'none', // we animate via RAF, not CSS transition
              }}
            >
              {/* Gold needle — points to Qibla */}
              <div style={{
                width: 4, height: 80, position: 'absolute', top: 30, left: '50%',
                transform: 'translateX(-50%)', borderRadius: 3,
                background: aligned
                  ? 'linear-gradient(to bottom,#3D8B5E,rgba(61,139,94,.2))'
                  : 'linear-gradient(to bottom,var(--acc),rgba(196,164,74,.2))',
                boxShadow: aligned ? '0 0 12px rgba(61,139,94,.5)' : '0 0 10px rgba(196,164,74,.3)',
                transition: 'background .3s, box-shadow .3s',
              }} />
              {/* Red tail */}
              <div style={{ width: 4, height: 45, position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', borderRadius: 3, background: 'rgba(184,80,80,.5)' }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute', width: 12, height: 12, background: aligned ? 'var(--green)' : 'var(--acc)',
                borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                boxShadow: aligned ? '0 0 8px rgba(61,139,94,.6)' : '0 0 8px rgba(196,164,74,.5)',
                zIndex: 2, transition: 'background .3s',
              }} />
            </div>

            {/* Activate overlay when not active */}
            {!compassActive && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(0,0,0,.15)', zIndex: 4 }}>
                <div style={{ background: 'var(--acc)', borderRadius: 20, padding: '6px 14px', fontSize: 11, fontWeight: 600, color: '#080D0A', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ph ph-cursor-click"></i> Tap to start
                </div>
              </div>
            )}
          </div>

          {/* Direction display */}
          <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 700, color: aligned ? 'var(--green)' : 'var(--acc)', transition: 'color .3s' }}>
            {qiblaDir !== null ? `${qiblaDir.toFixed(1)}°` : '—°'}
          </div>

          {/* Aligned badge */}
          {aligned && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(61,139,94,.12)', border: '1px solid rgba(61,139,94,.3)', borderRadius: 20, padding: '5px 14px', margin: '8px 0' }}>
              <i className="ph ph-check-circle" style={{ color: 'var(--green)' }}></i>
              <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>Facing Mecca!</span>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{status}</div>
          {coords && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <i className="ph ph-map-pin" style={{ fontSize: 11 }}></i>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </div>
          )}
          {compassActive && (
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
              Device heading: {heading}°
            </div>
          )}
        </div>

        {error && <div className="err-box"><i className="ph ph-warning"></i> {error}</div>}

        {/* City search */}
        <div className="card2" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ph ph-magnifying-glass"></i> Search city (if GPS is unavailable)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="inp" style={{ flex: 1 }} value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCity()}
              placeholder="City name (e.g. Kuala Lumpur)"
            />
            <button className="btn primary" onClick={searchCity}>Get</button>
          </div>
        </div>

        {/* Calibration tips */}
        <div className="info-box" style={{ flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <i className="ph ph-device-mobile-camera" style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 1 }}></i>
            <div>
              <strong>Calibrate:</strong> Move phone in figure-8 pattern for 5 seconds before using.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <i className="ph ph-warning" style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 1 }}></i>
            <div>Keep away from metal objects, magnets, and electronics. Hold phone flat and level.</div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <i className="ph ph-apple-logo" style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 1 }}></i>
            <div><strong>iOS:</strong> Tap compass once — Safari will ask for motion permission.</div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <i className="ph ph-android-logo" style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 1 }}></i>
            <div><strong>Android:</strong> Compass activates automatically after tap.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
