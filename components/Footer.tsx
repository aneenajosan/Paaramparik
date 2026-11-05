import Link from 'next/link';
import Logo from './Logo';
import ReplayIntroButton from './ReplayIntroButton';

export default function Footer() {
  return (
    <footer className="mt-section bg-crimson-900/50">
      <div className="kasavu" aria-hidden />
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-cream-muted">Local culture beyond the tourist trail — contributed by communities, reviewed by people, sourced in the open.</p>
          <div className="mt-4">
            <ReplayIntroButton />
          </div>
        </div>
        <nav aria-label="Footer"><p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-sm"><li><Link href="/">Map</Link></li><li><Link href="/directory">Directory</Link></li><li><Link href="/story">Story of the Day</Link></li><li><Link href="/contribute">Contribute a listing</Link></li></ul></nav>
        <div><p className="eyebrow mb-3">Trust</p><p className="text-sm text-cream-muted">Every listing shows its sources and review status. New submissions are never published until an administrator has reviewed them.</p></div>
      </div>
    </footer>
  );
}
