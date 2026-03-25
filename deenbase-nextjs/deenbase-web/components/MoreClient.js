'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang, useTheme, useToast } from '../app/AppShell';
export default function MoreClient() {
  const { lang, setLang } = useLang();
  const { dark, toggle: toggleTheme } = useTheme();
  const toast = useToast();
  const [bm, setBm] = useState([]);
  useEffect(() => { try { setBm(JSON.parse(localStorage.getItem('db-bookmarks') || '[]')); } catch { } }, []);
  const clearBM = () => { if (!confirm('Clear all bookmarks?')) return; localStorage.removeItem('db-bookmarks'); setBm([]); toast('Bookmarks cleared'); };
  const resetAll = () => { if (!confirm('Reset all data?')) return;['db-bookmarks', 'db-completed', 'db-azkar', 'db-prayer', 'db-lastread', 'db-arabicsize'].forEach(k => { try { localStorage.removeItem(k); } catch { } }); toast('Data cleared'); };
  const LINKS = [
    { href: '/names', icon: 'ph-star-four', title: '99 Names', sub: 'Asmaul Husna' },
    { href: '/quotes', icon: 'ph-quotes', title: 'Quran Quotes', sub: 'Comfort · Trust · Mercy' },
    { href: '/zikir', icon: 'ph-hands-praying', title: 'Zikir', sub: 'Morning · Evening' },
    { href: '/qibla', icon: 'ph-compass', title: 'Qibla', sub: 'Live compass' },
    { href: '/search', icon: 'ph-magnifying-glass', title: 'Search', sub: 'Search Quran text' },
  ];
  return (
    <div>
      <div className="page-header"><h1>More</h1></div>
      <div className="page-body">
        <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, fontWeight: 600, marginBottom: 9, marginTop: 4 }}>Library</div>
        <div className="grid2 mb-12">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="qcard">
              <i className={`ph ${l.icon} qc-icon`}></i>
              <div className="qc-title">{l.title}</div>
              <div className="qc-sub">{l.sub}</div>
            </Link>
          ))}
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, fontWeight: 600, marginBottom: 9 }}>Display</div>
        <div className="setting-row mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="ph ph-moon" style={{ color: 'var(--acc)' }}></i><span style={{ fontSize: 13, fontWeight: 500 }}>Dark Mode</span></div>
          <div className={`toggle${dark ? ' on' : ''}`} onClick={toggleTheme}></div>
        </div>
        <div className="setting-row mb-12">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="ph ph-translate" style={{ color: 'var(--acc)' }}></i><span style={{ fontSize: 13, fontWeight: 500 }}>Translation Language</span></div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['en', 'EN'], ['ms', 'BM']].map(([l, lb]) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid', borderColor: lang === l ? 'var(--acc)' : 'var(--brd)', background: lang === l ? 'var(--acc)' : 'var(--surf2)', color: lang === l ? '#080D0A' : 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{lb}</button>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, fontWeight: 600, marginBottom: 9 }}>Bookmarks ({bm.length})</div>
        {bm.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>No bookmarks yet.</p> : bm.slice(-8).reverse().map(b => { const [s, a] = b.split(':'); return (<div key={b} style={{ padding: '8px 0', borderTop: '1px solid var(--brd)', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13 }}>Surah {s} · Ayah {a}</span><Link href={`/quran/${s}`} style={{ fontSize: 11, color: 'var(--acc)', textDecoration: 'none' }}>Open →</Link></div>); })}
        <button className="btn danger w-full mt-8" onClick={clearBM}><i className="ph ph-trash"></i> Clear All Bookmarks</button>
        <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, fontWeight: 600, margin: '14px 0 9px' }}>About</div>
        <div className="card2">
          <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 19, fontWeight: 700, color: 'var(--acc)', marginBottom: 8 }}>DeenBase v3.2</div>
          {[['ph-book-open-text', 'Quran: Tanzil · AlQuran.cloud'], ['ph-clock', 'Prayer Times: Aladhan API'], ['ph-speaker-high', 'Audio: Mishary Alafasy · islamic.network'], ['ph-compass', 'Qibla: Aladhan + Haversine'], ['ph-shield-check', 'No AI · No ads · No data collection']].map(([ic, t]) => (
            <div key={t} style={{ display: 'flex', gap: 7, marginBottom: 4 }}><i className={`ph ${ic}`} style={{ color: 'var(--acc)', marginTop: 2, flexShrink: 0 }}></i><span style={{ color: 'var(--muted)', fontSize: 12 }}>{t}</span></div>
          ))}
        </div>
        <button className="btn danger w-full mt-10" onClick={resetAll}><i className="ph ph-arrow-counter-clockwise"></i> Reset All Data</button>
      </div>
    </div>
  );
}
