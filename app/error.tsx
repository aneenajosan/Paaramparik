'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page section text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-3 text-cream-muted">{error.message}</p>
      <button onClick={reset} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
