'use client';
import dynamic from 'next/dynamic';
import type { CultureMapProps } from './CultureMapInner';

const Inner = dynamic(() => import('./CultureMapInner'), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center bg-crimson-900 text-sm text-cream-muted" role="status">Loading map…</div>,
});
export default function CultureMap(props: CultureMapProps) {
  return (
    <div
      className="overflow-hidden border border-crimson-800 w-full h-full relative isolate z-0"
      style={{
        height: props.height || '100%',
        minHeight: props.height && props.height !== '100%' ? props.height : '360px',
      }}
    >
      <Inner {...props} />
    </div>
  );
}
