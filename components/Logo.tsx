import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="Paaramparik — home">
      <span className="flex h-9 w-9 items-center justify-center bg-saffron-500 text-crimson-950 transition-transform group-hover:scale-105">
        <MapPin size={20} strokeWidth={2.5} />
      </span>
      <span className="flex flex-col justify-center leading-none">
        <span className="font-samarkan text-2xl tracking-wide text-cream group-hover:text-saffron-400 transition-colors">
          Paaramparik
        </span>
        <span className="block text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-saffron-500">
          Cultural Map
        </span>
      </span>
    </Link>
  );
}
