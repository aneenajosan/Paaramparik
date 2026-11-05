import Link from 'next/link';
import { MapPin } from 'lucide-react';
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="The Living Culture Map — home">
      <span className="flex h-9 w-9 items-center justify-center bg-saffron-500 text-crimson-950"><MapPin size={20} strokeWidth={2.5} /></span>
      <span className="font-display text-lg font-bold leading-none">Living Culture<span className="block text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-saffron-500">Map</span></span>
    </Link>
  );
}
