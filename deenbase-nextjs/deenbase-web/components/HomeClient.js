'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang, useTheme } from './Shell';
import { SALAH } from '../data/constants';

const QUICK = [
  { href: '/quran', icon: 'ph-book-open-text', title: 'Al-Quran', sub: '114 Surahs · EN/BM' },
  { href: '/prayer', icon: 'ph-clock-clockwise', title: 'Prayer Times', sub: 'Adzan · JAKIM' },
  { href: '/qibla', icon: 'ph-compass', title: 'Qibla', sub: 'Live compass' },
  { href: '/zikir', icon: 'ph-hands-praying', title: 'Zikir & Dua', sub: 'Morning · Evening' },
  { href: '/names', icon: 'ph-star-four', title: '99 Names', sub: 'Asmaul Husna' },
  { href: '/quotes', icon: 'ph-quotes', title: 'Quran Quotes', sub: 'Comfort · Trust · Mercy' },
];

const PRAYER_ICON = { Fajr: 'ph-sun-horizon', Dhuhr: 'ph-sun', Asr: 'ph-cloud-sun', Maghrib: 'ph-clouds-sun', Isha: 'ph-moon-stars' };

export default function HomeClient({ prayerData, hijri, nextPrayer: initialNext }) {
  const { lang, setLang } = useLang();
  const { dark, setDark } = useTheme();
  const [nextPrayer, setNextPrayer] = useState(initialNext);
  const [countdown, setCountdown] = useState('');
  const [bm, setBm] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [stats, setStats] = useState({ read: 0, bm: 0, zikr: 0 });

  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('db-bookmarks') || '[]');
      const completed = JSON.parse(localStorage.getItem('db-completed') || '[]');
      const counters = JSON.parse(localStorage.getItem('db-azkar') || '{}');
      const lr = localStorage.getItem('db-lastread');
      const lrAyah = localStorage.getItem('db-lastayah');
      if (lr) setLastRead({ surah: +lr, ayah: +(lrAyah || 1) });
      setBm(bookmarks.slice(-4).reverse());
      setStats({
        read: completed.length,
        bm: bookmarks.length,
        zikr: Object.values(counters).reduce((a, b) => a + b, 0),
      });
    } catch { }
  }, []);

  // Live countdown
  useEffect(() => {
    if (!prayerData?.timings) return;
    const tick = () => {
      const now = new Date(), cur = now.getHours() * 60 + now.getMinutes();
      // Recompute next prayer
      let next = null;
      for (const n of SALAH) {
        const t = prayerData.timings[n]; if (!t) continue;
        const [h, m] = t.split(':').map(Number);
        if (h * 60 + m > cur) { next = { name: n, time: t, mins: h * 60 + m }; break; }
      }
      if (!next) { const t = prayerData.timings.Fajr || '05:00'; const [h, m] = t.split(':').map(Number); next = { name: 'Fajr', time: t, mins: h * 60 + m }; }
      setNextPrayer(next);
      let diff = next.mins - cur; if (diff <= 0) diff += 1440;
      const h = Math.floor(diff / 60), m = diff % 60;
      setCountdown(`in ${h > 0 ? h + 'h ' : ''}${m}min`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [prayerData]);

  return (
    <div className="page-body">

      {/* Bismillah */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 700, color: 'var(--acc)' }}>
          DeenBase
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setLang(lang === 'en' ? 'ms' : 'en')}
            style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surf)', border: '1px solid var(--brd)', color: 'var(--acc)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {lang === 'en' ? 'EN' : 'BM'}
          </button>
          <button
            onClick={() => setDark(!dark)}
            style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surf)', border: '1px solid var(--brd)', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`ph ${dark ? 'ph-sun' : 'ph-moon'}`}></i>
          </button>
        </div>
      </div>

      {/* Prayer hero */}
      {nextPrayer && (
        <Link href="/prayer" className="prayer-hero-card">
          <div>
            <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '.9px', color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ph ph-map-pin" style={{ fontSize: 11 }}></i>
              {prayerData?.meta?.timezone?.split('/')[1] || 'Kuala Lumpur'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className={`ph ${PRAYER_ICON[nextPrayer.name] || 'ph-clock'}`} style={{ color: 'var(--acc)' }}></i>
              {nextPrayer.name}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color: 'var(--muted)' }}>{countdown}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 700, color: 'var(--acc)', lineHeight: 1.1 }}>
              {nextPrayer.time}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
              <i className="ph ph-arrow-right" style={{ fontSize: 10 }}></i> All times
            </div>
          </div>
        </Link>
      )}

      {/* Hijri */}
      {hijri && (
        <div className="hijri-bar">
          <i className="ph ph-calendar-blank" style={{ fontSize: 14 }}></i>
          {hijri.day} {hijri.month.en} {hijri.year} AH · {hijri.month.ar} {hijri.year} هـ
        </div>
      )}

      {/* Stats */}
      <div className="stat-row">
        {[['st-read', stats.read, 'Surahs Read'], ['st-bm', stats.bm, 'Bookmarks'], ['st-zikr', stats.zikr, 'Zikr Done']].map(([k, v, l]) => (
          <div key={k} className="stat-box">
            <div className="stat-val">{v}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>

      {/* Continue reading */}
      {lastRead && (
        <div className="card flex items-center justify-between mb-10">
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 3 }}>Continue Reading</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Surah {lastRead.surah} · Ayah {lastRead.ayah}</div>
          </div>
          <Link href={`/quran/${lastRead.surah}`} className="btn primary sm">
            <i className="ph ph-arrow-right"></i> Resume
          </Link>
        </div>
      )}

      {/* Quick access */}
      <div className="grid2 mb-12">
        {QUICK.map(q => (
          <Link key={q.href} href={q.href} className="qcard">
            <i className={`ph ${q.icon} qc-icon`}></i>
            <div className="qc-title">{q.title}</div>
            <div className="qc-sub">{q.sub}</div>
          </Link>
        ))}
      </div>

      {/* Bookmarks */}
      {bm.length > 0 && (
        <div className="card mb-12">
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.9px', color: 'var(--muted)', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ph ph-bookmarks"></i> Recent Bookmarks
          </div>
          {bm.map(b => {
            const [s, a] = b.split(':');
            return (
              <Link key={b} href={`/quran/${s}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--brd)', textDecoration: 'none' }}>
                <span className="accent" style={{ fontSize: 13, fontWeight: 500 }}>Surah {s}</span>
                <span className="muted" style={{ fontSize: 11 }}>Ayah {a} →</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="trust-strip">
        <i className="ph ph-shield-check" style={{ marginRight: 5 }}></i>
        No AI · All sources verified · No ads<br />
        Quran: AlQuran.cloud · Prayer: Aladhan API
      </div>
    </div>
  );
}
