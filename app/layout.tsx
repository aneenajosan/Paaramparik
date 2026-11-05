import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StartupAnimation from '@/components/StartupAnimation';

export const metadata: Metadata = {
  title: { default: 'The Living Culture Map', template: '%s · The Living Culture Map' },
  description: 'Discover local traditions, artists, places and festivals beyond the tourist trail — community-contributed and reviewed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col">
        <StartupAnimation />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-saffron-500 focus:p-3 focus:text-crimson-950">Skip to content</a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
