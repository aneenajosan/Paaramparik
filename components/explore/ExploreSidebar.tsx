'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Map as MapIcon,
  CalendarDays,
  BookOpen,
  Users,
  Plus,
  Heart,
  FolderTree,
  ShieldCheck,
  X,
} from 'lucide-react';
import Logo from '@/components/Logo';

interface ExploreSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  savedCount: number;
  onSelectQuickType?: (type: string) => void;
  activeType?: string;
}

export default function ExploreSidebar({
  isOpen,
  onClose,
  savedCount,
  onSelectQuickType,
  activeType,
}: ExploreSidebarProps) {
  const pathname = usePathname();

  const handleTypeClick = (type: string) => {
    if (onSelectQuickType) {
      onSelectQuickType(type);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-crimson-950 border-r border-crimson-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Explore Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-crimson-900/60">
          <Logo variant="light" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-cream-muted hover:text-cream hover:bg-crimson-900/60 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Group */}
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/'
                  ? 'bg-saffron-500 text-crimson-950 shadow-sm'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link
              href="/explore"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/explore' && !activeType
                  ? 'bg-crimson-900 text-saffron-400 border border-crimson-800'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <MapIcon size={18} />
              <span>Map & Explore</span>
            </Link>

            <button
              type="button"
              onClick={() => handleTypeClick('event')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeType === 'event'
                  ? 'bg-crimson-900 text-saffron-400 border border-crimson-800'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <CalendarDays size={18} />
                <span>Events & Festivals</span>
              </div>
            </button>

            <Link
              href="/story"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/story'
                  ? 'bg-saffron-500 text-crimson-950'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <BookOpen size={18} />
              <span>Cultural Stories</span>
            </Link>

            <button
              type="button"
              onClick={() => handleTypeClick('artist')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeType === 'artist'
                  ? 'bg-crimson-900 text-saffron-400 border border-crimson-800'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Users size={18} />
                <span>Artists & Organizers</span>
              </div>
            </button>
          </div>

          {/* Submit Event Callout Action */}
          <div className="pt-2">
            <Link
              href="/contribute"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-crimson-950 font-bold text-sm shadow-md shadow-saffron-500/10 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Submit Event</span>
            </Link>
          </div>

          <div className="h-px bg-crimson-800/60" />

          {/* Secondary Group */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleTypeClick('saved')}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeType === 'saved'
                  ? 'bg-crimson-900 text-saffron-400 border border-crimson-800'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Heart size={18} />
                <span>Saved Traditions</span>
              </div>
              {savedCount > 0 && (
                <span className="rounded-full bg-saffron-500/20 text-saffron-400 px-2 py-0.5 text-xs font-bold">
                  {savedCount}
                </span>
              )}
            </button>

            <Link
              href="/directory"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/directory'
                  ? 'bg-saffron-500 text-crimson-950'
                  : 'text-cream/90 hover:bg-crimson-900/50 hover:text-cream'
              }`}
            >
              <FolderTree size={18} />
              <span>Cultural Directory</span>
            </Link>

            <div className="px-4 py-3 rounded-lg bg-crimson-900/40 border border-crimson-800/50 text-xs text-cream-muted/90">
              <div className="flex items-center gap-1.5 font-bold text-saffron-400 mb-1">
                <ShieldCheck size={14} />
                <span>Verified Heritage</span>
              </div>
              <p className="leading-relaxed">
                All submissions are vetted by cultural moderators before publication.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Motif: Kasavu Stripes with Kerala Temple Line Art */}
        <div className="relative mt-auto border-t border-crimson-900/60 overflow-hidden bg-gradient-to-b from-crimson-950 to-crimson-900/80 p-4">
          <div className="kasavu mb-3" aria-hidden="true" />
          <div className="flex items-center justify-between text-[11px] text-cream-muted/70">
            <span>Paaramparik Map</span>
            <span>v1.0 • Kerala</span>
          </div>
        </div>
      </aside>
    </>
  );
}

