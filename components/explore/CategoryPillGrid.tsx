'use client';

import React from 'react';
import {
  Music,
  Palette,
  Sparkles,
  Landmark,
  Hammer,
  Drama,
  Users,
} from 'lucide-react';
import type { Category } from '@/types';

interface CategoryPillGridProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const CATEGORY_THEMES: Record<
  string,
  { icon: React.ElementType; bg: string; text: string; border: string; label: string }
> = {
  'music-percussion': {
    icon: Music,
    bg: 'bg-[#CC6F00]/20 hover:bg-[#CC6F00]/30',
    text: 'text-[#FF933E]',
    border: 'border-[#CC6F00]/50',
    label: 'Music & Percussion',
  },
  'visual-arts': {
    icon: Palette,
    bg: 'bg-[#FF933E]/20 hover:bg-[#FF933E]/30',
    text: 'text-[#FF933E]',
    border: 'border-[#FF933E]/50',
    label: 'Visual Arts',
  },
  'performing-arts': {
    icon: Drama,
    bg: 'bg-[#CC6F00]/25 hover:bg-[#CC6F00]/35',
    text: 'text-[#FF933E]',
    border: 'border-[#CC6F00]/60',
    label: 'Performing Arts',
  },
  'heritage-architecture': {
    icon: Landmark,
    bg: 'bg-[#FF933E]/15 hover:bg-[#FF933E]/25',
    text: 'text-[#FF933E]',
    border: 'border-[#FF933E]/40',
    label: 'Heritage Places',
  },
  'crafts-textiles': {
    icon: Hammer,
    bg: 'bg-[#CC6F00]/20 hover:bg-[#CC6F00]/30',
    text: 'text-[#FF933E]',
    border: 'border-[#CC6F00]/50',
    label: 'Traditional Crafts',
  },
  'festivals-rituals': {
    icon: Sparkles,
    bg: 'bg-[#FF933E]/25 hover:bg-[#FF933E]/35',
    text: 'text-[#FF933E]',
    border: 'border-[#FF933E]/50',
    label: 'Festivals & Rituals',
  },
};

export default function CategoryPillGrid({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryPillGridProps) {
  return (
    <section className="space-y-3" aria-label="Explore by Category">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-cream">
          Explore by Category
        </h2>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className="text-xs font-semibold text-saffron-400 hover:text-saffron-300 underline underline-offset-4"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const theme = CATEGORY_THEMES[cat.id] || {
            icon: Users,
            bg: 'bg-crimson-800/40 hover:bg-crimson-800/60',
            text: 'text-saffron-400',
            border: 'border-crimson-700',
            label: cat.name,
          };
          const Icon = theme.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? '' : cat.id)}
              className={`group flex min-w-[130px] flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-saffron-400 bg-crimson-900 shadow-md shadow-saffron-500/10 scale-105'
                  : 'border-crimson-800/80 bg-crimson-950/70 hover:border-crimson-700 hover:bg-crimson-900/40'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${theme.bg} ${theme.text}`}
              >
                <Icon size={22} strokeWidth={2} />
              </div>
              <span
                className={`text-xs font-semibold leading-tight line-clamp-1 ${
                  isSelected ? 'text-saffron-400' : 'text-cream/90 group-hover:text-cream'
                }`}
              >
                {theme.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

