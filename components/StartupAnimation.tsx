'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, SkipForward, Sparkles } from 'lucide-react';

interface StartupAnimationProps {
  /** Optional custom video source, defaults to /startup-animation.mp4 */
  src?: string;
  /** Force animation to show regardless of sessionStorage */
  forceShow?: boolean;
  /** Callback fired when animation finishes or is skipped */
  onComplete?: () => void;
}

export default function StartupAnimation({
  src = '/startup-animation.mp4',
  forceShow = false,
  onComplete,
}: StartupAnimationProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    if (fading) return;
    setFading(true);

    try {
      sessionStorage.setItem('lcm_startup_seen', 'true');
    } catch {
      // Ignore sessionStorage exceptions (private browsing / quota)
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait for the CSS fade-out transition to complete
    setTimeout(() => {
      setVisible(false);
      setFading(false);
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }, 600);
  }, [fading, onComplete]);

  // Check if animation should play on mount
  useEffect(() => {
    let shouldShow = false;
    try {
      const hasSeen = sessionStorage.getItem('lcm_startup_seen');
      const urlParams = new URLSearchParams(window.location.search);
      const replayParam = urlParams.get('intro') === 'true' || urlParams.get('intro') === '1';

      if (forceShow || replayParam || !hasSeen) {
        shouldShow = true;
      }
    } catch {
      shouldShow = true;
    }

    if (shouldShow) {
      setVisible(true);
      document.body.style.overflow = 'hidden';

      // Safety fallback: dismiss after 15 seconds in case of stall or broken playback
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, 15000);
    }

    // Custom event listener so any button in the app can replay the intro
    const handleReplayEvent = () => {
      setVisible(true);
      setFading(false);
      setProgress(0);
      document.body.style.overflow = 'hidden';
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('lcm:replay-startup', handleReplayEvent);

    return () => {
      window.removeEventListener('lcm:replay-startup', handleReplayEvent);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.body.style.overflow = '';
    };
  }, [forceShow, handleDismiss]);

  // Handle keyboard escape key to skip
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleDismiss]);

  // Update progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress(Math.min(100, (current / total) * 100));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !muted;
      videoRef.current.muted = nextMuted;
      setMuted(nextMuted);
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paaramparik Opening Animation"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-crimson-950/95 backdrop-blur-md transition-opacity duration-700 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial gradient to complement mandala */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-saffron-950/40 via-crimson-950/90 to-black pointer-events-none" />

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 select-none">
        <div className="flex items-center gap-2.5 text-saffron-400 font-samarkan text-xl sm:text-2xl tracking-wide">
          <Sparkles className="w-4 h-4 animate-pulse text-saffron-400" />
          <span>Paaramparik</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute/Unmute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cream-muted bg-crimson-900/60 hover:bg-crimson-800/80 hover:text-cream border border-crimson-700/50 rounded-full backdrop-blur-sm transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-saffron-400" />}
            <span className="hidden sm:inline">{muted ? 'Unmute' : 'Muted'}</span>
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-crimson-950 bg-saffron-500 hover:bg-saffron-400 border border-saffron-400 rounded-full shadow-lg shadow-saffron-500/20 transition-all hover:scale-105 active:scale-95"
            aria-label="Skip intro animation"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-8">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleDismiss}
          onError={handleDismiss}
          className="w-full h-full object-contain max-h-[85vh] drop-shadow-[0_0_35px_rgba(224,96,0,0.25)] rounded-lg"
        />
      </div>

      {/* Bottom Progress Bar & Hint */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pb-4 select-none">
        <div className="container-page flex flex-col items-center gap-2">
          <p className="text-[11px] font-medium tracking-widest uppercase text-cream-muted/70">
            Press <kbd className="px-1.5 py-0.5 rounded bg-crimson-900/80 border border-crimson-700/60 text-saffron-400 font-mono text-[10px]">Esc</kbd> to skip
          </p>
          <div className="w-48 sm:w-64 h-1 bg-crimson-900/80 rounded-full overflow-hidden border border-crimson-800/40">
            <div
              className="h-full bg-gradient-to-r from-crimson-500 via-saffron-500 to-saffron-400 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

