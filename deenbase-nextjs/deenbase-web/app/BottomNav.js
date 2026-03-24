'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    // Helper function to check if a tab is active
    const isActive = (path) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--surf)',
            borderTop: '1px solid var(--brd)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 20px 0',
            zIndex: 50
        }}>

            <Link href="/" style={{ color: isActive('/') ? 'var(--acc)' : 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                <i className={isActive('/') ? "ph-fill ph-house" : "ph ph-house"} style={{ fontSize: '24px' }}></i>
                Home
            </Link>

            <Link href="/quran" style={{ color: isActive('/quran') ? 'var(--acc)' : 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                <i className={isActive('/quran') ? "ph-fill ph-book-open-text" : "ph ph-book-open-text"} style={{ fontSize: '24px' }}></i>
                Quran
            </Link>

            <Link href="/prayer" style={{ color: isActive('/prayer') ? 'var(--acc)' : 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                <i className={isActive('/prayer') ? "ph-fill ph-clock" : "ph ph-clock"} style={{ fontSize: '24px' }}></i>
                Prayer
            </Link>

            <Link href="/qibla" style={{ color: isActive('/qibla') ? 'var(--acc)' : 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                <i className={isActive('/qibla') ? "ph-fill ph-compass" : "ph ph-compass"} style={{ fontSize: '24px' }}></i>
                Qibla
            </Link>

        </nav>
    );
}