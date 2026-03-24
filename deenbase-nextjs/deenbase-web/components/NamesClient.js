'use client';
import { useState } from 'react';
import { NAMES99 } from '../data/constants';

export default function NamesClient() {
  const [q, setQ] = useState('');
  const list = q.trim() ? NAMES99.filter(n=>n.tr.toLowerCase().includes(q.toLowerCase())||n.m.toLowerCase().includes(q.toLowerCase())||n.ar.includes(q)) : NAMES99;
  const speak = (ar) => { if(!window.speechSynthesis)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(ar);u.lang='ar-SA';u.rate=0.65;speechSynthesis.speak(u); };
  return (
    <div>
      <div className="page-header"><h1>99 Names of Allah</h1></div>
      <div className="page-body">
        <div style={{position:'relative',marginBottom:11}}>
          <i className="ph ph-magnifying-glass" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:15,pointerEvents:'none'}}></i>
          <input className="inp" style={{paddingLeft:34}} placeholder="Search by name or meaning…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        {list.map(n=>(
          <div key={n.n} className="name-card">
            <div style={{width:29,height:29,borderRadius:'50%',background:'var(--acc3)',color:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,border:'1px solid rgba(196,164,74,.2)'}}>{n.n}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5,fontWeight:600,color:'var(--txt)',marginBottom:2}}>{n.tr}</div>
              <div style={{fontSize:11,color:'var(--muted)',lineHeight:1.5}}>{n.m}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button className="btn ghost sm" onClick={()=>speak(n.ar)}><i className="ph ph-speaker-high" style={{fontSize:14}}></i></button>
              <span style={{fontFamily:'Amiri,serif',fontSize:22,color:'var(--acc)',direction:'rtl'}}>{n.ar}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
