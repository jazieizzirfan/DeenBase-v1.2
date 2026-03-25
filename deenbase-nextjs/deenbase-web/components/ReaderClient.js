'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLang, useToast } from '../app/Shell';
import { audioUrl } from '../lib/api';

export default function ReaderClient({ surahNum, data: initialData, initialLang }) {
  const router = useRouter();
  const { lang, toggle: toggleLang } = useLang();
  const toast = useToast();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [arabicSize, setArabicSize] = useState(1.7);
  const [tafsirOn, setTafsirOn] = useState(true);
  const [tafsirs, setTafsirs] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [showAudio, setShowAudio] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mushafMode, setMushafMode] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      setBookmarks(JSON.parse(localStorage.getItem('db-bookmarks') || '[]'));
      setCompleted(JSON.parse(localStorage.getItem('db-completed') || '[]'));
      const sz = localStorage.getItem('db-arabicsize');
      if (sz) setArabicSize(+sz);
    } catch { }
    // Save last read
    try {
      localStorage.setItem('db-lastread', String(surahNum));
      localStorage.setItem('db-lastayah', '1');
    } catch { }
  }, [surahNum]);

  // Reload if lang changes
  useEffect(() => {
    if (lang !== initialLang && !loading) {
      setLoading(true);
      fetch(`/api/surah?num=${surahNum}&lang=${lang}`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [lang]);

  const toggleBM = (s, a) => {
    const k = `${s}:${a}`;
    const cur = JSON.parse(localStorage.getItem('db-bookmarks') || '[]');
    const idx = cur.indexOf(k);
    const updated = idx >= 0 ? cur.filter(x => x !== k) : [...cur, k];
    localStorage.setItem('db-bookmarks', JSON.stringify(updated));
    setBookmarks(updated);
    toast(updated.includes(k) ? 'Bookmarked' : 'Bookmark removed');
  };

  const toggleComplete = () => {
    const num = surahNum;
    const cur = JSON.parse(localStorage.getItem('db-completed') || '[]');
    const updated = cur.includes(num) ? cur.filter(x => x !== num) : [...cur, num];
    localStorage.setItem('db-completed', JSON.stringify(updated));
    setCompleted(updated);
    toast(updated.includes(num) ? '✓ Surah marked complete' : 'Unmarked');
  };

  const copyAyah = async (arText, trText, s, a) => {
    try {
      await navigator.clipboard.writeText(`${arText}\n\n${trText}\n\n— Quran ${s}:${a}`);
      toast('Ayah copied');
    } catch { toast('Copy not available in this browser'); }
  };

  const shareAyah = async (arText, trText, s, a) => {
    const text = `${arText}\n\n${trText}\n\n— Quran ${s}:${a}`;
    if (navigator.share) { try { await navigator.share({ title: `Quran ${s}:${a}`, text }); return; } catch { } }
    copyAyah(arText, trText, s, a);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) { toast('Speech not supported'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA'; u.rate = 0.75;
    speechSynthesis.speak(u);
    toast('Playing Arabic…');
  };

  const loadTafsir = async (s, a) => {
    const key = `${s}:${a}`;
    if (tafsirs[key] !== undefined) { setTafsirs(p => { const n = { ...p }; delete n[key]; return n; }); return; }
    setTafsirs(p => ({ ...p, [key]: 'loading' }));
    try {
      const r = await fetch(`/api/tafsir?surah=${s}&ayah=${a}`);
      const d = await r.json();
      setTafsirs(p => ({ ...p, [key]: d.text || 'No tafsir available.' }));
    } catch { setTafsirs(p => ({ ...p, [key]: 'Could not load tafsir.' })); }
  };

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl(surahNum));
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current.duration) setProgress(audioRef.current.currentTime / audioRef.current.duration * 100);
      };
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); };
      setShowAudio(true);
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false); setProgress(0); setShowAudio(false);
  };

  const chSize = (d) => {
    const next = Math.min(3.5, Math.max(1.2, +(arabicSize + d).toFixed(1)));
    setArabicSize(next);
    try { localStorage.setItem('db-arabicsize', String(next)); } catch { }
  };

  const ar = data?.arabic;
  const tr = data?.translation;
  const isDone = completed.includes(surahNum);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 6 }}>
        <button className="btn ghost sm" onClick={() => router.back()} style={{ padding: '4px 8px' }}>
          <i className="ph ph-arrow-left"></i>
        </button>
        <h1 style={{ flex: 1, fontSize: 18 }}>{ar?.englishName || `Surah ${surahNum}`}</h1>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <button className="btn sm" onClick={() => setMushafMode(v => !v)} style={{ borderColor: mushafMode ? 'var(--acc)' : '' }}>
            <i className="ph ph-text-aa"></i> {mushafMode ? 'Mushaf' : 'Trans.'}
          </button>
          <button className="btn sm" onClick={() => setTafsirOn(v => !v)} style={{ color: tafsirOn ? 'var(--acc)' : '' }}>
            <i className="ph ph-note-pencil"></i>
          </button>
          <button className="btn sm" onClick={toggleLang}>{lang === 'en' ? 'EN' : 'BM'}</button>
          <button className="btn sm" onClick={toggleAudio}>
            <i className={`ph ${playing ? 'ph-pause' : 'ph-speaker-high'}`}></i>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surf2)', border: '1px solid var(--brd)', borderRadius: 9, padding: '3px 8px' }}>
            <button className="btn ghost sm" style={{ padding: '2px 6px', border: 'none', background: 'none' }} onClick={() => chSize(-.2)}><i className="ph ph-minus"></i></button>
            <span style={{ fontSize: 11, minWidth: 26, textAlign: 'center' }}>{arabicSize.toFixed(1)}</span>
            <button className="btn ghost sm" style={{ padding: '2px 6px', border: 'none', background: 'none' }} onClick={() => chSize(.2)}><i className="ph ph-plus"></i></button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Audio bar */}
        {showAudio && (
          <div className="audio-bar">
            <button className="audio-play-btn" onClick={toggleAudio}>
              <i className={`ph-fill ${playing ? 'ph-pause' : 'ph-play'}`}></i>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Mishary Alafasy · Surah {surahNum}</div>
              <div style={{ height: 3, background: 'var(--surf3)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--acc)', width: `${progress}%`, transition: 'width .4s' }}></div>
              </div>
            </div>
            <button className="btn ghost sm" onClick={stopAudio}><i className="ph ph-x"></i></button>
          </div>
        )}

        {loading ? (
          <div className="loader"><i className="ph ph-circle-notch"></i>Loading Surah…</div>
        ) : !data ? (
          <div className="err-box"><i className="ph ph-warning"></i> Failed to load Surah. Check connection.</div>
        ) : (
          <>
            {/* Surah header */}
            <div className="card2 mb-12" style={{ textAlign: 'center' }}>
              <div className="arabic accent" style={{ fontSize: 24, marginBottom: 4 }}>{ar.name}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700 }}>{ar.englishName}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                {ar.englishNameTranslation} · {ar.numberOfAyahs} Ayahs · {ar.revelationType}
              </div>
              <div className="flex gap-6 mt-10" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn sm" onClick={toggleComplete} style={{ borderColor: isDone ? 'var(--green)' : '' }}>
                  <i className={`ph ${isDone ? 'ph-check-circle' : 'ph-circle'}`}></i>
                  {isDone ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>

            {/* Bismillah */}
            {ar.number !== 9 && ar.number !== 1 && (
              <div className="arabic accent" style={{ fontSize: 21, textAlign: 'center', marginBottom: 13, fontFamily: 'Amiri, serif' }}>
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ
              </div>
            )}

            {/* Mushaf mode */}
            {mushafMode ? (
              <div className="card" style={{ padding: 20 }}>
                <p style={{ fontFamily: 'Amiri, serif', fontSize: `${arabicSize * 1.1}rem`, lineHeight: arabicSize * 2, direction: 'rtl', textAlign: 'justify', color: 'var(--txt)' }}>
                  {ar.ayahs.map(a => `${a.text} \u06DD${a.numberInSurah}\u06DD `).join('')}
                </p>
              </div>
            ) : (
              ar.ayahs.map((ayah, i) => {
                const ta = tr?.ayahs?.[i];
                const bk = bookmarks.includes(`${surahNum}:${ayah.numberInSurah}`);
                const tk = `${surahNum}:${ayah.numberInSurah}`;
                return (
                  <div key={ayah.number} className="ayah-card">
                    <div className="flex items-center justify-between mb-8">
                      <div className="num-tag">{ayah.numberInSurah}</div>
                      <div className="flex gap-4">
                        <button className="btn ghost sm" onClick={() => speak(ayah.text)} title="Listen">
                          <i className="ph ph-speaker-high"></i>
                        </button>
                        <button className="btn ghost sm" onClick={() => copyAyah(ayah.text, ta?.text || '', surahNum, ayah.numberInSurah)} title="Copy">
                          <i className="ph ph-copy"></i>
                        </button>
                        <button className="btn ghost sm" onClick={() => shareAyah(ayah.text, ta?.text || '', surahNum, ayah.numberInSurah)} title="Share">
                          <i className="ph ph-share-network"></i>
                        </button>
                        <button className="btn ghost sm" onClick={() => toggleBM(surahNum, ayah.numberInSurah)} title="Bookmark">
                          <i className={`ph${bk ? '-fill' : ''} ph-bookmark`} style={{ color: bk ? 'var(--acc)' : '' }}></i>
                        </button>
                        {tafsirOn && (
                          <button className="btn ghost sm" onClick={() => loadTafsir(surahNum, ayah.numberInSurah)} title="Tafsir" style={{ color: tafsirs[tk] !== undefined ? 'var(--acc)' : '' }}>
                            <i className="ph ph-note-pencil"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Amiri, serif', fontSize: `${arabicSize}rem`, direction: 'rtl', textAlign: 'right', lineHeight: arabicSize * 1.9, color: 'var(--txt)' }}>
                      {ayah.text}
                    </p>
                    {ta && (
                      <p style={{ borderTop: '1px solid var(--brd)', paddingTop: 8, marginTop: 8, fontSize: 12.5, lineHeight: 1.8, color: 'var(--txt2)', fontStyle: 'italic' }}>
                        {ta.text}
                      </p>
                    )}
                    {tafsirs[tk] === 'loading' && (
                      <div style={{ background: 'var(--surf3)', borderRadius: 10, padding: 12, marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>Loading tafsir…</div>
                    )}
                    {tafsirs[tk] && tafsirs[tk] !== 'loading' && (
                      <div style={{ background: 'var(--surf3)', border: '1px solid var(--brd2)', borderRadius: 10, padding: 12, marginTop: 10 }}>
                        <div style={{ fontSize: 10, color: 'var(--acc)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 5 }}>Tafsir Note</div>
                        <p style={{ fontSize: 12, lineHeight: 1.78, color: 'var(--txt2)' }}>{tafsirs[tk]}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
