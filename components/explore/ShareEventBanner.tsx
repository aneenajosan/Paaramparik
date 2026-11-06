'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';

export default function ShareEventBanner() {
  return (
    <section
      aria-label="Contribute to Paaramparik"
      className="relative overflow-hidden rounded-2xl border border-saffron-600/40 bg-gradient-to-r from-crimson-950 via-crimson-900 to-saffron-950 p-6 sm:p-8 shadow-xl"
    >
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-saffron-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-cream">
              Share a Cultural Event
            </h2>
            <p className="mt-1 text-sm text-cream/80 leading-relaxed">
              Have an event, temple festival, classical workshop or performance? Submit it to bring
              your community’s traditions to the living map.
            </p>
          </div>
        </div>

        <Link
          href="/contribute"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-3 text-sm font-bold text-crimson-950 shadow-lg shadow-saffron-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <span>Submit Event</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
