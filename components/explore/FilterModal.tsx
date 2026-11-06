'use client';

import React from 'react';
import { X, Check, RotateCcw, SlidersHorizontal, Calendar, MapPin, DollarSign, ShieldCheck } from 'lucide-react';
import { TYPE_META, TYPES, EXPERIENCE_LABEL } from '@/lib/listing-meta';
import type { Category, ListingType } from '@/types';
import type { Filters } from '@/lib/filter';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  categories: Category[];
  localities: string[];
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  categories,
  localities,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}: FilterModalProps) {
  if (!isOpen) return null;

  const toggleType = (t: ListingType) => {
    const next = filters.types.includes(t)
      ? filters.types.filter((x) => x !== t)
      : [...filters.types, t];
    onFilterChange('types', next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal Container */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-crimson-800 bg-crimson-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-crimson-900/80 px-6 py-5 bg-crimson-900/40">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-500/20 text-saffron-400">
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-cream">Cultural Discovery Filters</h3>
              <p className="text-xs text-cream-muted">
                Showing <strong className="text-saffron-400">{filteredCount}</strong> of {totalCount} traditions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-cream-muted hover:text-saffron-400 hover:bg-crimson-900/60 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-cream-muted hover:bg-crimson-900/80 hover:text-cream transition-colors"
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Listing Types Checkboxes */}
          <div>
            <label className="label text-xs uppercase tracking-wider text-saffron-500">Listing Type</label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const isSelected = filters.types.includes(t);
                const meta = TYPE_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-saffron-500 bg-saffron-950/60 text-saffron-400 shadow-sm'
                        : 'border-crimson-800/80 bg-crimson-900/40 text-cream/80 hover:bg-crimson-900/70 hover:text-cream'
                    }`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-cream"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.glyph}
                    </span>
                    <span className="truncate">{meta.plural}</span>
                    {isSelected && <Check size={14} className="ml-auto text-saffron-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Art Form / Category */}
          <div>
            <label className="label text-xs uppercase tracking-wider text-saffron-500">Art Form / Category</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onFilterChange('category', '')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  !filters.category
                    ? 'bg-saffron-500 text-crimson-950 font-bold'
                    : 'bg-crimson-900/60 text-cream/80 border border-crimson-800 hover:text-cream'
                }`}
              >
                All Art Forms
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onFilterChange('category', filters.category === c.id ? '' : c.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filters.category === c.id
                      ? 'bg-saffron-500 text-crimson-950 font-bold'
                      : 'bg-crimson-900/60 text-cream/80 border border-crimson-800 hover:text-cream'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location & Locality */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-saffron-500 mb-2">
              <MapPin size={13} />
              <span>Location / Locality</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => onFilterChange('location', '')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !filters.location
                    ? 'bg-saffron-500 text-crimson-950 font-bold'
                    : 'bg-crimson-900/60 text-cream/80 border border-crimson-800 hover:text-cream'
                }`}
              >
                All Locations
              </button>
              {localities.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => onFilterChange('location', filters.location === loc ? '' : loc)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filters.location === loc
                      ? 'bg-saffron-500 text-crimson-950 font-bold'
                      : 'bg-crimson-900/60 text-cream/80 border border-crimson-800 hover:text-cream'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Date Presets & Custom Range */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-saffron-500 mb-2">
              <Calendar size={13} />
              <span>Date Filter</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { id: '', label: 'All Dates' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'today', label: 'Today' },
                { id: 'month', label: 'This Month' },
              ].map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => onFilterChange('datePreset', dp.id as any)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    (filters.datePreset || '') === dp.id
                      ? 'bg-saffron-500 text-crimson-950 font-bold'
                      : 'bg-crimson-900/60 text-cream/80 border border-crimson-800 hover:text-cream'
                  }`}
                >
                  {dp.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-cream-muted block mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => onFilterChange('from', e.target.value)}
                  className="input !text-xs !py-2"
                />
              </div>
              <div>
                <label className="text-[11px] text-cream-muted block mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => onFilterChange('to', e.target.value)}
                  className="input !text-xs !py-2"
                />
              </div>
            </div>
          </div>

          {/* Experience Type & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs uppercase tracking-wider text-saffron-500">Experience Type</label>
              <select
                value={filters.experience}
                onChange={(e) => onFilterChange('experience', e.target.value)}
                className="input !text-xs !py-2"
              >
                <option value="">Any Experience</option>
                {Object.entries(EXPERIENCE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-xs uppercase tracking-wider text-saffron-500">Cost / Participation</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onFilterChange('cost', filters.cost === 'free' ? '' : 'free')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    filters.cost === 'free'
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                      : 'border-crimson-800 bg-crimson-900/40 text-cream hover:bg-crimson-900'
                  }`}
                >
                  Free Only
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('cost', filters.cost === 'paid' ? '' : 'paid')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    filters.cost === 'paid'
                      ? 'border-saffron-500 bg-saffron-950/60 text-saffron-400'
                      : 'border-crimson-800 bg-crimson-900/40 text-cream hover:bg-crimson-900'
                  }`}
                >
                  Ticketed / Paid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-crimson-900/80 bg-crimson-900/40 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-cream-muted">
            Matching <strong className="text-saffron-400">{filteredCount}</strong> traditions
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-saffron-500 hover:bg-saffron-400 text-crimson-950 font-bold px-6 py-2.5 text-xs shadow-lg shadow-saffron-500/20 transition-all hover:scale-105 active:scale-95"
          >
            Show {filteredCount} Results
          </button>
        </div>
      </div>
    </div>
  );
}

