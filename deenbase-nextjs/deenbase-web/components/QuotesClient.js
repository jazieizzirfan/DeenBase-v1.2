'use client';
import { useState } from 'react';
import { useLang, useToast } from './Shell';
import { QUOTES } from '../data/constants';

export default function QuotesClient() {
  const { lang } = useLang();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const speak = (ar) => { if(!window.speechSynthesis)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(ar);u.lang='ar-SA';u.rate=.7;speechSynthesis.speak(u); };
  const copy = async (ref, text) => { try{await navigator.clipboard.writeText(`"${text}"\n\n— Quran ${ref}`);toast('Copied');}catch{} };
  const share = async (ref, text) => {
    if(navigator.share){try{await navigator.share({title:`Quran ${ref}`,text:`"${text}"\n\n— Quran ${ref}`});return;}catch{}}
    copy(ref,text);
  };
  const cat = QUOTES[tab];
  return (
    <div>
      <div className="page-header"><h1>Quran Quotes</h1></div>
      <div className="page-body">
        <div className="tabs mb-12">{QUOTES.map((q,i)=>(
          <button key={q.subtitle} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{q.subtitle}</button>
        ))}</div>
        <div style={{color:'var(--acc)',fontSize:14,fontFamily:'Cormorant Garamond,serif',fontWeight:700,marginBottom:10}}>{cat.category}</div>
        <div className="info-box mb-12"><i className="ph ph-shield-check" style={{color:'var(--acc)',flexShrink:0}}></i> All verses directly from verified Quranic sources. No AI. No paraphrasing.</div>
        {cat.items.map(q=>{
          const text = lang==='ms'?q.ms:q.en;
          return (
            <div key={q.ref} className="quote-card">
              <div style={{borderLeft:'3px solid var(--acc)',paddingLeft:12,marginBottom:10}}>
                <p style={{fontFamily:'Amiri,serif',fontSize:22,lineHeight:2.1,color:'var(--txt)',direction:'rtl',textAlign:'right'}}>{q.ar}</p>
              </div>
              <p style={{fontSize:12.5,color:'var(--txt2)',fontStyle:'italic',lineHeight:1.85,marginBottom:10}}>{text}</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span className="badge"><i className="ph ph-book-open-text"></i> {q.ref}</span>
                <div style={{display:'flex',gap:4}}>
                  <button className="btn ghost sm" onClick={()=>speak(q.ar)}><i className="ph ph-speaker-high"></i></button>
                  <button className="btn ghost sm" onClick={()=>copy(q.ref,text)}><i className="ph ph-copy"></i></button>
                  <button className="btn ghost sm" onClick={()=>share(q.ref,text)}><i className="ph ph-share-network"></i></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
