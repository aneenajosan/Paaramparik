'use client';

import { Sparkles } from 'lucide-react';

export default function ReplayIntroButton() {
  const handleReplay = () => {
    window.dispatchEvent(new CustomEvent('lcm:replay-startup'));
  };

  return (
    <button
      type="button"
      onClick={handleReplay}
      className="inline-flex items-center gap-1.5 text-xs text-cream-muted hover:text-saffron-400 transition-colors"
      title="Replay opening mandala animation"
    >
      <Sparkles className="w-3 h-3 text-saffron-500" />
      <span>Replay Opening Animation</span>
    </button>
  );
}
