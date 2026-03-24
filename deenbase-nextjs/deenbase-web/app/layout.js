import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'DeenBase – Islamic Reference',
  description: 'Verified Islamic Reference. Quran, Prayer Times, Zikir, 99 Names. No AI. No ads.',
  themeColor: '#080D0A',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'DeenBase', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  const t = localStorage.getItem('db-theme');
                  if (t === 'light') document.documentElement.setAttribute('data-theme','light');
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body
        style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', borderLeft: '1px solid var(--brd)', borderRight: '1px solid var(--brd)' }}>
        {children}
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
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}>
            <i className="ph ph-house" style={{ fontSize: '24px' }}></i>
            Home
          </Link>
          <Link href="/quran" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}>
            <i className="ph ph-book-open-text" style={{ fontSize: '24px' }}></i>
            Quran
          </Link>
          <Link href="/prayer" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}>
            <i className="ph ph-clock" style={{ fontSize: '24px' }}></i>
            Prayer
          </Link>
          <Link href="/qibla" style={{ color: 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}>
            <i className="ph ph-compass" style={{ fontSize: '24px' }}></i>
            Qibla
          </Link>
        </nav>
      </body>
    </html>
  );
}
