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
    bg: 'bg-orange-600/20 hover:bg-orange-600/30',
    text: 'text-orange-400',
    border: 'border-orange-500/50',
    label: 'Music & Percussion',
  },
  'visual-arts': {
    icon: Palette,
    bg: 'bg-rose-600/20 hover:bg-rose-600/30',
    text: 'text-rose-400',
    border: 'border-rose-500/50',
    label: 'Visual Arts',
  },
  'performing-arts': {
    icon: Drama,
    bg: 'bg-purple-600/20 hover:bg-purple-600/30',
    text: 'text-purple-400',
    border: 'border-purple-500/50',
    label: 'Performing Arts',
  },
  'heritage-architecture': {
    icon: Landmark,
    bg: 'bg-teal-600/20 hover:bg-teal-600/30',
    text: 'text-teal-400',
    border: 'border-teal-500/50',
    label: 'Heritage Places',
  },
  'crafts-textiles': {
    icon: Hammer,
    bg: 'bg-amber-600/20 hover:bg-amber-600/30',
    text: 'text-amber-400',
    border: 'border-amber-500/50',
    label: 'Traditional Crafts',
  },
  'festivals-rituals': {
    icon: Sparkles,
    bg: 'bg-yellow-600/20 hover:bg-yellow-600/30',
    text: 'text-yellow-400',
    border: 'border-yellow-500/50',
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
        <h2 className="font-display text-xl sm:text-2xl font-bold text-crimson-950">
          Explore by Category
        </h2>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 underline underline-offset-4"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const theme = CATEGORY_THEMES[cat.id] || {
            icon: Users,
            bg: 'bg-stone-100 hover:bg-stone-200',
            text: 'text-stone-700',
            border: 'border-stone-200',
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
                  ? 'border-saffron-500 bg-saffron-50/80 shadow-md ring-2 ring-saffron-400/30 scale-105'
                  : 'border-stone-200/90 bg-white shadow-xs hover:border-stone-300 hover:shadow-md hover:bg-stone-50/50'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${theme.bg} ${theme.text}`}
              >
                <Icon size={22} strokeWidth={2} />
              </div>
              <span
                className={`text-xs font-semibold leading-tight line-clamp-1 ${
                  isSelected ? 'text-saffron-800 font-bold' : 'text-stone-700 group-hover:text-crimson-950'
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

