'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function SearchClient() {
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('en');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const doSearch = async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(''); setResults([]);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`);
      const d = await r.json();
      if (d.error) setErr(d.error); else if(!d.results.length) setErr('No results found.'); else setResults(d.results);
    } catch { setErr('Search failed.'); }
    setLoading(false);
  };
  return (
    <div>
      <div className="page-header"><h1>Search Quran</h1></div>
      <div className="page-body">
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          <div style={{flex:1,position:'relative'}}>
            <i className="ph ph-magnifying-glass" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:15,pointerEvents:'none'}}></i>
            <input className="inp" style={{paddingLeft:34}} placeholder="Search Quran text…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} />
          </div>
          <button className="btn primary" onClick={doSearch}><i className="ph ph-magnifying-glass"></i> Search</button>
        </div>
        <div className="tabs">
          {[['en','🇬🇧 English'],['ms','🇲🇾 Bahasa']].map(([l,lb])=>(
            <button key={l} className={`tab${lang===l?' active':''}`} onClick={()=>setLang(l)}>{lb}</button>
          ))}
        </div>
        {loading && <div className="loader"><i className="ph ph-circle-notch"></i>Searching…</div>}
        {err && <p style={{color:'var(--muted)',fontSize:13,marginTop:10}}>{err}</p>}
        {results.map((r,i)=>(
          <div key={i} style={{background:'var(--surf)',border:'1px solid var(--brd)',borderRadius:14,padding:13,marginBottom:7}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
              <span className="badge"><i className="ph ph-book-open-text"></i> {r.surah?.englishName} {r.surah?.number}:{r.numberInSurah}</span>
              <Link href={`/quran/${r.surah?.number}`} className="btn sm"><i className="ph ph-arrow-right"></i> Open</Link>
            </div>
            <p style={{fontSize:12.5,color:'var(--txt2)',lineHeight:1.8}}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
