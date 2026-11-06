'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lcm_saved_listings');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.includes(listingId)) {
          setSaved(true);
        }
      }
    } catch {
      // ignore local storage errors
    }
  }, [listingId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem('lcm_saved_listings');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      let nextSaved = !saved;
      if (nextSaved) {
        if (!list.includes(listingId)) list.push(listingId);
      } else {
        list = list.filter((id) => id !== listingId);
      }

      localStorage.setItem('lcm_saved_listings', JSON.stringify(list));
      setSaved(nextSaved);
      window.dispatchEvent(new CustomEvent('lcm:saved-updated', { detail: { count: list.length } }));
    } catch {
      setSaved(!saved);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={saved ? 'Remove from saved' : 'Save tradition'}
      className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
        saved
          ? 'bg-crimson-600/90 text-cream shadow-md scale-110'
          : 'bg-crimson-950/70 text-cream/80 hover:bg-crimson-900 hover:text-cream hover:scale-105'
      }`}
    >
      <Heart size={15} className={saved ? 'fill-cream stroke-cream' : 'stroke-current'} />
    </button>
  );
}
