'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '../app/AppShell';
import { JUZ_MAP } from '../data/constants';

const FILTERS = ['All', 'Meccan', 'Medinan', 'Completed'];

export default function QuranListClient({ surahs }) {
  const { lang, toggle: toggleLang } = useLang();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [completed, setCompleted] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [showJuz, setShowJuz] = useState(false);

  useEffect(() => {
    try {
      setCompleted(JSON.parse(localStorage.getItem('db-completed') || '[]'));
      const lr = localStorage.getItem('db-lastread');
      if (lr) setLastRead(+lr);
    } catch { }
  }, []);

  const filtered = surahs.filter(s => {
    if (filter === 'Meccan') return s.revelationType === 'Meccan';
    if (filter === 'Medinan') return s.revelationType === 'Medinan';
    if (filter === 'Completed') return completed.includes(s.number);
    return true;
  }).filter(s =>
    !query.trim() ||
    s.englishName.toLowerCase().includes(query.toLowerCase()) ||
    s.englishNameTranslation.toLowerCase().includes(query.toLowerCase()) ||
    String(s.number).includes(query)
  );

  return (
    <div>
      <div className="page-header">
        <h1>Al-Quran</h1>
        <div className="flex gap-4">
          <button className="btn sm" onClick={toggleLang}>{lang === 'en' ? 'EN' : 'BM'}</button>
          <button className="btn sm" onClick={() => setShowJuz(v => !v)}>
            <i className="ph ph-list-numbers"></i> Juz
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Juz grid */}
        {showJuz && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 5, marginBottom: 12 }}>
            {JUZ_MAP.map((s, i) => (
              <Link
                key={i}
                href={`/quran/${s}`}
                onClick={() => setShowJuz(false)}
                style={{ background: 'var(--surf2)', border: '1px solid var(--brd)', borderRadius: 9, padding: '8px 4px', textAlign: 'center', fontSize: 11, color: 'var(--txt)', textDecoration: 'none', display: 'block' }}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15, pointerEvents: 'none' }}></i>
          <input
            className="inp"
            style={{ paddingLeft: 34 }}
            placeholder="Search Surah name or number…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="tabs">
          {FILTERS.map(f => (
            <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {/* List */}
        {filtered.map(s => {
          const done = completed.includes(s.number);
          const isLast = lastRead === s.number;
          return (
            <Link
              key={s.number}
              href={`/quran/${s.number}${lang === 'ms' ? '?lang=ms' : ''}`}
              className={`surah-item${done ? ' completed' : ''}`}
            >
              <div className="num-tag">{s.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.englishName}
                  {isLast && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--acc)', flexShrink: 0, display: 'inline-block' }}></span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {s.englishNameTranslation} · {s.numberOfAyahs} ayahs · {s.revelationType}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {done && <i className="ph-fill ph-check-circle" style={{ color: 'var(--green)', fontSize: 15 }}></i>}
                <span className="arabic accent" style={{ fontSize: 18 }}>{s.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
