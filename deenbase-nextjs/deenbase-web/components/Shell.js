'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Theme context ──────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: true, toggle: () => {} });
export function useTheme() { return useContext(ThemeCtx); }

// ── Lang context ───────────────────────────────────────────────────
const LangCtx = createContext({ lang: 'en', toggle: () => {}, setLang: () => {} });
export function useLang() { return useContext(LangCtx); }

// ── Toast context ──────────────────────────────────────────────────
const ToastCtx = createContext((msg) => {});
export function useToast() { return useContext(ToastCtx); }

// ── Nav items ──────────────────────────────────────────────────────
const NAV = [
  { href: '/',        icon: 'ph-house',            label: 'Home'   },
  { href: '/quran',   icon: 'ph-book-open-text',    label: 'Quran'  },
  { href: '/prayer',  icon: 'ph-clock-clockwise',   label: 'Prayer' },
  { href: '/zikir',   icon: 'ph-hands-praying',     label: 'Zikir'  },
  { href: '/more',    icon: 'ph-dots-three-outline', label: 'More'  },
];

export default function Shell({ children }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState('en');
  const [toast, setToast] = useState({ msg: '', show: false });

  useEffect(() => {
    try {
      const t = localStorage.getItem('db-theme');
      const l = localStorage.getItem('db-lang');
      if (t === 'light') { setDark(false); document.documentElement.setAttribute('data-theme', 'light'); }
      if (l) setLang(l);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(d => {
      const next = !d;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('db-theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === 'en' ? 'ms' : 'en';
      try { localStorage.setItem('db-lang', next); } catch {}
      return next;
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  }, []);

  // Active nav: match first segment
  const activeNav = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <ThemeCtx.Provider value={{ dark, toggle: toggleTheme }}>
      <LangCtx.Provider value={{ lang, toggle: toggleLang, setLang }}>
        <ToastCtx.Provider value={showToast}>
          <div className="app-shell">

            {/* Sidebar / bottom nav */}
            <nav className="sidebar">
              <div className="nav-logo">Deen<span>Base</span></div>
              <div className="nav-items">
                {NAV.map(n => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`nav-item${activeNav(n.href) ? ' active' : ''}`}
                  >
                    <i className={`ph ${n.icon}`}></i>
                    {n.label}
                  </Link>
                ))}
              </div>
              {/* Desktop: theme + lang at bottom */}
              <div style={{ display: 'none', padding: '8px', gap: '5px', borderTop: '1px solid var(--brd)', marginTop: 'auto' }} className="sidebar-actions">
                <button className="btn ghost" onClick={toggleTheme} style={{ flex: 1 }}>
                  <i className={`ph ${dark ? 'ph-sun' : 'ph-moon'}`}></i>
                  {dark ? 'Light' : 'Dark'}
                </button>
                <button className="btn ghost" onClick={toggleLang} style={{ flex: 1 }}>
                  <i className="ph ph-translate"></i>
                  {lang === 'en' ? 'BM' : 'EN'}
                </button>
              </div>
            </nav>

            {/* Main content */}
            <div className="main-content">
              {/* Mobile top bar */}
              <div className="topbar">
                <span className="topbar-logo">Deen<span>Base</span></span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button className="btn sm" onClick={toggleLang}>
                    <i className="ph ph-translate"></i> {lang === 'en' ? 'EN' : 'BM'}
                  </button>
                  <button className="btn icon-btn" onClick={toggleTheme}>
                    <i className={`ph ${dark ? 'ph-sun' : 'ph-moon'}`}></i>
                  </button>
                </div>
              </div>
              {children}
            </div>

          </div>

          {/* Toast */}
          <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
        </ToastCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  );
}
