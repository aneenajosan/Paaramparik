'use client';
import { useCallback, useState } from 'react';

export type Position = { lat: number; lng: number };
export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle');
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) return setStatus('unsupported');
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setStatus('granted'); },
      () => setStatus('denied'),
      { timeout: 10000 },
    );
  }, []);
  return { position, status, locate };
}
