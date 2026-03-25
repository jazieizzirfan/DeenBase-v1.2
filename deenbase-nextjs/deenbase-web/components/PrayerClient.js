'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '../app/AppShell';
import { SALAH, PRAYER_ICONS } from '../data/constants';
import { ZONE_LIST } from '../lib/waktusolat';

const EXTRA_ICONS = { Sunrise: 'ph-sun-dim', Imsak: 'ph-fork-knife' };

const MY_STATES = [
  { label: 'Kuala Lumpur / Putrajaya', zones: [{ code: 'WLY01', name: 'KL & Putrajaya' }, { code: 'WLY02', name: 'Putrajaya' }, { code: 'WLY03', name: 'Labuan' }] },
  { label: 'Selangor', zones: ZONE_LIST.filter(z => z.code.startsWith('SGR')) },
  { label: 'Johor', zones: ZONE_LIST.filter(z => z.code.startsWith('JHR')) },
  { label: 'Kedah', zones: ZONE_LIST.filter(z => z.code.startsWith('KDH')) },
  { label: 'Kelantan', zones: ZONE_LIST.filter(z => z.code.startsWith('KTN')) },
  { label: 'Melaka', zones: ZONE_LIST.filter(z => z.code.startsWith('MLK')) },
  { label: 'Negeri Sembilan', zones: ZONE_LIST.filter(z => z.code.startsWith('NSN')) },
  { label: 'Pahang', zones: ZONE_LIST.filter(z => z.code.startsWith('PHG')) },
  { label: 'Pulau Pinang', zones: ZONE_LIST.filter(z => z.code.startsWith('PNG')) },
  { label: 'Perak', zones: ZONE_LIST.filter(z => z.code.startsWith('PRK')) },
  { label: 'Perlis', zones: ZONE_LIST.filter(z => z.code.startsWith('PLS')) },
  { label: 'Sabah', zones: ZONE_LIST.filter(z => z.code.startsWith('SBH')) },
  { label: 'Sarawak', zones: ZONE_LIST.filter(z => z.code.startsWith('SWK')) },
  { label: 'Terengganu', zones: ZONE_LIST.filter(z => z.code.startsWith('TRG')) },
];

export default function PrayerClient() {
  const toast = useToast();
  const [prayerData, setPrayerData] = useState(null);
  const [zone, setZone] = useState('WLY01');
  const [zoneName, setZoneName] = useState('KL & Putrajaya');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [next, setNext] = useState(null);
  const [cd, setCd] = useState('');
  const [adzanOn, setAdzanOn] = useState(false);
  const [mode, setMode] = useState('MY');
  const [wCity, setWCity] = useState('');
  const [wCountry, setWCountry] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const adzRef = useRef(false);
  const lastKey = useRef('');

  useEffect(() => {
    const z = localStorage.getItem('db-zone') || 'WLY01';
    const n = localStorage.getItem('db-zonename') || 'KL & Putrajaya';
    const m = localStorage.getItem('db-prayer-mode') || 'MY';
    setZone(z); setZoneName(n); setMode(m);
    const cached = localStorage.getItem('db-prayer-v2');
    if (cached) { try { setPrayerData(JSON.parse(cached)); setLoading(false); return; } catch { } }
    doLoad(z, m);
  }, []);

  useEffect(() => { adzRef.current = adzanOn; }, [adzanOn]);

  useEffect(() => {
    if (!prayerData?.timings) return;
    const tick = () => {
      const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
      let nx = null;
      for (const n of SALAH) {
        const t = prayerData.timings[n]; if (!t || t === '—') continue;
        const [h, m] = t.split(':').map(Number);
        if (h * 60 + m > cur) { nx = { name: n, time: t, mins: h * 60 + m }; break; }
      }
      if (!nx) { const t = prayerData.timings.Fajr || '05:00'; const [h, m] = t.split(':').map(Number); nx = { name: 'Fajr', time: t, mins: h * 60 + m }; }
      setNext(nx);
      let d = nx.mins - cur; if (d <= 0) d += 1440;
      setCd(`in ${Math.floor(d / 60) > 0 ? Math.floor(d / 60) + 'h ' : ''}${d % 60}min`);
      if (adzRef.current && now.getSeconds() === 0) {
        const key = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (lastKey.current !== key) {
          for (const n of SALAH) { if ((prayerData.timings[n] || '').slice(0, 5) === key) { fireAdzan(n); lastKey.current = key; break; } }
        }
      }
    };
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [prayerData]);

  async function doLoad(z, m, city, country) {
    setLoading(true); setError('');
    try {
      let url = m === 'MY'
        ? `/api/prayer?zone=${encodeURIComponent(z)}`
        : `/api/prayer?city=${encodeURIComponent(city || wCity)}&country=${encodeURIComponent(country || wCountry || 'US')}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setPrayerData(data);
      try { localStorage.setItem('db-prayer-v2', JSON.stringify(data)); } catch { }
    } catch { setError('Network error. Check connection.'); }
    setLoading(false);
  }

  async function loadGPS() {
    if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude: la, longitude: lo } = pos.coords;
        const res = await fetch(`/api/prayer?lat=${la}&lng=${lo}`);
        const data = await res.json();
        if (data.error) { setError(data.error); }
        else { setPrayerData(data); if (data.meta?.zone) { setZone(data.meta.zone); setZoneName(data.meta.zone); } try { localStorage.setItem('db-prayer-v2', JSON.stringify(data)); } catch { } }
      } catch { setError('Location lookup failed.'); }
      setLoading(false);
    }, () => { setError('Location denied.'); setLoading(false); });
  }

  function selectZone(code, name) {
    setZone(code); setZoneName(name); setShowPicker(false);
    try { localStorage.setItem('db-zone', code); localStorage.setItem('db-zonename', name); } catch { }
    doLoad(code, 'MY');
  }

  async function toggleAdzan() {
    if (!adzanOn) {
      if ('Notification' in window) { const p = await Notification.requestPermission(); if (p !== 'granted') { toast('Notification permission denied'); return; } }
      setAdzanOn(true); toast('Adzan alerts enabled');
    } else { setAdzanOn(false); toast('Adzan alerts disabled'); }
  }

  function fireAdzan(prayer) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { try { new Notification(`${prayer} — Waktu Solat`, { body: `Telah tiba waktu ${prayer}. Allahu Akbar.`, tag: 'prayer', renotify: true }); } catch { } }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [392, 440, 392, 329, 370, 329, 392].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .65;
        o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .55);
        o.start(t); o.stop(t + .6);
      });
    } catch { }
    toast(`${prayer} — Waktu Solat`);
  }

  const timings = prayerData?.timings;

  return (
    <div>
      <div className="page-header">
        <h1>Waktu Solat</h1>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className={`btn sm${mode === 'MY' ? ' primary' : ''}`} onClick={() => setMode('MY')}>🇲🇾 MY</button>
          <button className={`btn sm${mode === 'WORLD' ? ' primary' : ''}`} onClick={() => setMode('WORLD')}>🌍 World</button>
        </div>
      </div>
      <div className="page-body">

        {/* Adzan toggle */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <i className="ph ph-bell" style={{ fontSize: 26, color: 'var(--acc)', flexShrink: 0 }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Adzan Alerts</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{adzanOn ? '✓ Aktif — notifikasi pada setiap waktu solat' : 'Aktifkan untuk notifikasi waktu solat'}</div>
          </div>
          <div className={`toggle${adzanOn ? ' on' : ''}`} onClick={toggleAdzan}></div>
        </div>

        {/* MY zone picker */}
        {mode === 'MY' && (
          <div className="card2" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ph ph-map-pin"></i> Zon JAKIM · Waktu Solat Malaysia
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'space-between', display: 'flex' }} onClick={() => setShowPicker(v => !v)}>
                <span style={{ fontSize: 12 }}><b>{zone}</b> — {zoneName}</span>
                <i className={`ph ${showPicker ? 'ph-caret-up' : 'ph-caret-down'}`}></i>
              </button>
              <button className="btn sm" onClick={loadGPS} title="Auto-detect zone via GPS">
                <i className="ph ph-crosshair"></i>
              </button>
            </div>
            {showPicker && (
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--brd)', borderRadius: 10, background: 'var(--surf)' }}>
                {MY_STATES.map(st => (
                  <div key={st.label}>
                    <div style={{ padding: '6px 12px', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--acc)', fontWeight: 700, background: 'var(--surf3)', borderBottom: '1px solid var(--brd)' }}>
                      {st.label}
                    </div>
                    {st.zones.map(z => (
                      <button key={z.code} onClick={() => selectZone(z.code, z.name)} style={{ width: '100%', padding: '8px 12px', background: zone === z.code ? 'var(--acc3)' : 'transparent', border: 'none', borderBottom: '1px solid var(--brd2)', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Sora,sans-serif' }}>
                        <span style={{ fontSize: 11.5, color: zone === z.code ? 'var(--acc)' : 'var(--txt)' }}>{z.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{z.code}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* World input */}
        {mode === 'WORLD' && (
          <div className="card2" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 7 }}><i className="ph ph-globe" style={{ marginRight: 5 }}></i>City / Country</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
              <input className="inp" style={{ flex: 1 }} value={wCity} onChange={e => setWCity(e.target.value)} placeholder="City (e.g. London)" />
              <input className="inp" style={{ width: 50, textAlign: 'center' }} value={wCountry} onChange={e => setWCountry(e.target.value)} placeholder="GB" maxLength={2} />
              <button className="btn primary" onClick={() => doLoad(zone, 'WORLD')}><i className="ph ph-arrow-right"></i></button>
            </div>
            <button className="btn sm" onClick={loadGPS} style={{ width: '100%' }}><i className="ph ph-crosshair"></i> GPS Location</button>
          </div>
        )}

        {error && <div className="err-box" style={{ marginBottom: 10 }}><i className="ph ph-warning"></i> {error}</div>}

        {loading ? (
          <div className="loader"><i className="ph ph-circle-notch"></i>Fetching waktu solat…</div>
        ) : timings ? (
          <>
            {prayerData?.source && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--muted)', marginBottom: 10, padding: '6px 10px', background: 'var(--acc4)', borderRadius: 8 }}>
                <i className="ph ph-shield-check" style={{ color: 'var(--acc)' }}></i>
                <span>Sumber: <strong>{prayerData.source}</strong></span>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 10 }}>
              {prayerData?.date?.readable || ''}
              {prayerData?.hijri && ` · ${prayerData.hijri.day} ${prayerData.hijri.month.en} ${prayerData.hijri.year} H`}
            </div>
            {SALAH.map(name => {
              const isN = next?.name === name, t = timings[name];
              return (
                <div key={name} className={`prayer-row${isN ? ' next' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className={`ph ${PRAYER_ICONS[name]}`} style={{ fontSize: 20, color: isN ? 'var(--acc)' : 'var(--muted)' }}></i>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: isN ? 600 : 400, color: isN ? 'var(--acc)' : 'var(--txt)' }}>{name}</div>
                      {isN && <div style={{ fontSize: 10, color: 'var(--acc)' }}>{cd}</div>}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, fontWeight: 700, color: isN ? 'var(--acc)' : 'var(--txt)' }}>{t && t !== '—' ? t : '—'}</div>
                </div>
              );
            })}
            <div className="card2" style={{ marginTop: 8 }}>
              {['Sunrise', 'Imsak'].filter(n => timings[n] && timings[n] !== '—').map(n => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--brd)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><i className={`ph ${EXTRA_ICONS[n]}`} style={{ fontSize: 14 }}></i>{n}</span>
                  <span style={{ fontSize: 13 }}>{timings[n]}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <i className="ph ph-shield-check"></i> {prayerData?.meta?.method?.name || 'JAKIM'} · {prayerData?.source || 'Waktu Solat Malaysia'}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
