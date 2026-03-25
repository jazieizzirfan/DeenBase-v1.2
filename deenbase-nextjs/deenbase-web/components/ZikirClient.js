'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '../app/AppShell';
import { AZKAR } from '../data/constants';

const TABS = [
  { label: 'Morning', icon: 'ph-sun-horizon' }, { label: 'Evening', icon: 'ph-moon-stars' },
  { label: 'Tasbeeh', icon: 'ph-repeat' }, { label: 'Post-Salah', icon: 'ph-hands-praying' },
  { label: 'Daily Duas', icon: 'ph-star' },
];

export default function ZikirClient() {
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [counters, setCounters] = useState({});

  useEffect(() => {
    try { setCounters(JSON.parse(localStorage.getItem('db-azkar') || '{}')); } catch { }
  }, []);

  const save = (c) => { try { localStorage.setItem('db-azkar', JSON.stringify(c)); } catch { } };

  const inc = (k, max) => {
    const cur = (counters[k] || 0);
    if (cur >= max) return;
    const next = { ...counters, [k]: cur + 1 };
    setCounters(next); save(next);
  };

  const reset = (k) => {
    const next = { ...counters }; delete next[k];
    setCounters(next); save(next);
  };

  const resetCat = () => {
    const next = { ...counters };
    AZKAR[tab].items.forEach((_, i) => delete next[`${tab}-${i}`]);
    setCounters(next); save(next); toast('Azkar reset');
  };

  const speak = (ar) => {
    if (!window.speechSynthesis) { toast('Speech not supported'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ar); u.lang = 'ar-SA'; u.rate = 0.75;
    speechSynthesis.speak(u);
  };

  const cat = AZKAR[tab];
  const done = cat.items.filter((_, i) => (counters[`${tab}-${i}`] || 0) >= _.count).length;
  const pct = Math.round(done / cat.items.length * 100);

  return (
    <div>
      <div className="page-header">
        <h1>Zikir & Dua</h1>
        <div style={{ display: 'flex', gap: 5 }}>
          <Link href="/names" className="btn sm"><i className="ph ph-star-four"></i> 99 Names</Link>
          <Link href="/quotes" className="btn sm"><i className="ph ph-quotes"></i> Quotes</Link>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs">{TABS.map((t, i) => (
          <button key={t.label} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            <i className={`ph ${t.icon}`}></i> {t.label}
          </button>
        ))}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--muted)', marginBottom: 4 }}>
          <span>{cat.title}</span><span>{pct}%</span>
        </div>
        <div className="prog-bg mb-12"><div className="prog-fill" style={{ width: `${pct}%` }}></div></div>
        {cat.items.map((item, i) => {
          const k = `${tab}-${i}`, cur = counters[k] || 0, isDone = cur >= item.count;
          return (
            <div key={k} className={`zikr-card${isDone ? ' done' : ''}`}>
              {item.occ && <div style={{ fontSize: '9.5px', color: 'var(--acc)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 5 }}>{item.occ}</div>}
              <p style={{ fontFamily: 'Amiri,serif', direction: 'rtl', textAlign: 'right', fontSize: 24, lineHeight: 2.1, color: 'var(--txt)', marginBottom: 8 }}>{item.ar}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 }}>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.75, flex: 1, marginRight: 10 }}>{item.tr}</p>
                <button className="btn ghost sm" onClick={() => speak(item.ar)}><i className="ph ph-speaker-high"></i></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    style={{ background: isDone ? 'var(--surf3)' : 'var(--acc)', color: isDone ? 'var(--muted)' : '#080D0A', border: 'none', borderRadius: 8, padding: '8px 15px', fontSize: 12, fontFamily: 'Sora,sans-serif', fontWeight: 600, cursor: isDone ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={() => inc(k, item.count)} disabled={isDone}
                  >
                    <i className={`ph ${isDone ? 'ph-check' : 'ph-hand-tap'}`}></i>
                    {isDone ? 'Done' : `${cur} / ${item.count}`}
                  </button>
                  {cur > 0 && <button className="btn ghost sm" onClick={() => reset(k)}><i className="ph ph-arrow-counter-clockwise"></i></button>}
                </div>
                {isDone && <i className="ph-fill ph-check-circle" style={{ fontSize: 22, color: 'var(--green)' }}></i>}
              </div>
              {item.count > 1 && cur > 0 && <div className="prog-bg mt-8"><div className="prog-fill" style={{ width: `${Math.min(100, cur / item.count * 100)}%` }}></div></div>}
            </div>
          );
        })}
        <button className="btn sm ghost" onClick={resetCat} style={{ float: 'right', marginTop: 4 }}><i className="ph ph-arrow-counter-clockwise"></i> Reset category</button>
      </div>
    </div>
  );
}
