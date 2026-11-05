'use client';
import dynamic from 'next/dynamic';
import type { CultureMapProps } from './CultureMapInner';

const Inner = dynamic(() => import('./CultureMapInner'), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center bg-crimson-900 text-sm text-cream-muted" role="status">Loading map…</div>,
});
export default function CultureMap(props: CultureMapProps) {
  return <div className="overflow-hidden border border-crimson-800"><Inner {...props} /></div>;
}
