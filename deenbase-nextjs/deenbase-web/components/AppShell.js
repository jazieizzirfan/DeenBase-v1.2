'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ThemeCtx = createContext({ dark: true, toggle: () => { } });
export function useTheme() { return useContext(ThemeCtx); }

const LangCtx = createContext({ lang: 'en', toggle: () => { }, setLang: () => { } });
export function useLang() { return useContext(LangCtx); }

const ToastCtx = createContext((msg) => { });
export function useToast() { return useContext(ToastCtx); }

export default function Shell({ children }) {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState('en');
  const [toast, setToast] = useState({ msg: '', show: false });

  useEffect(() => {
    try {
      const t = localStorage.getItem('db-theme');
      const l = localStorage.getItem('db-lang');
      if (t === 'light') {
        setDark(false);
        document.documentElement.setAttribute('data-theme', 'light');
      }
      if (l) setLang(l);
    } catch { }
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(d => {
      const next = !d;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('db-theme', next ? 'dark' : 'light'); } catch { }
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === 'en' ? 'ms' : 'en';
      try { localStorage.setItem('db-lang', next); } catch { }
      return next;
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  }, []);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: toggleTheme }}>
      <LangCtx.Provider value={{ lang, toggle: toggleLang, setLang }}>
        <ToastCtx.Provider value={showToast}>
          {/* We removed the .app-shell, .sidebar, and .topbar divs from here */}
          <main className="main-content-wrapper">
            {children}
          </main>

          {/* Keep the Toast at the root */}
          <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
        </ToastCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  );
}