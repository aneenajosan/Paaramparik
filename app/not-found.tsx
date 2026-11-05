import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container-page section text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl">We couldn’t find that page</h1>
      <p className="mt-3 text-cream-muted">The listing may have been removed or is not yet published.</p>
      <Link href="/directory" className="btn-primary mt-6">Browse the directory</Link>
    </div>
  );
}
