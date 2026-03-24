'use client';
import { useLang, useTheme } from './Shell';
import { usePathname, useRouter } from 'next/navigation';

export default function TopNav() {
    const { lang, setLang } = useLang();
    const { dark, setDark } = useTheme();

    // These Next.js hooks let us read the URL and navigate history
    const pathname = usePathname();
    const router = useRouter();

    // Define the main root tabs where we DO NOT want a back button
    const isMainTab = ['/', '/quran', '/prayer', '/zikir', '/qibla', '/more'].includes(pathname);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 15px 10px 15px' }}>

            {/* Left Side: Back Button (if needed) + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isMainTab && (
                    <button
                        onClick={() => router.back()}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--acc)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <i className="ph ph-arrow-left" style={{ fontSize: 24 }}></i>
                    </button>
                )}
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 700, color: 'var(--acc)' }}>
                    DeenBase
                </div>
            </div>

            {/* Right Side: Toggles */}
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
    );
}