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
          ? 'bg-[#CC6F00] text-[#FFF5EB] shadow-md scale-110 border border-[#FF933E]'
          : 'bg-[#4D2A00]/80 text-[#FFF5EB]/80 hover:bg-[#5E3400] hover:text-[#FF933E] hover:scale-105 border border-[#7A4300]/50'
      }`}
    >
      <Heart size={15} className={saved ? 'fill-cream stroke-cream' : 'stroke-current'} />
    </button>
  );
}

