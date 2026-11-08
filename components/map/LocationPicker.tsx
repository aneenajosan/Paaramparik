'use client';
import dynamic from 'next/dynamic';
import type { PickerProps } from './LocationPickerInner';
const Inner = dynamic(() => import('./LocationPickerInner'), { ssr: false, loading: () => <div className="h-[320px] bg-crimson-900" role="status" /> });
export default function LocationPicker(props: PickerProps) {
  return <div className="overflow-hidden border border-crimson-800 relative isolate z-0"><Inner {...props} /></div>;
}
