import './globals.css';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

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
        <BottomNav />
      </body>
    </html>
  );
}
