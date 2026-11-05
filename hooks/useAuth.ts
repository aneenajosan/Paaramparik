'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Profile } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
        setProfile((data as Profile) ?? null);
      } else setProfile(null);
      setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { load(s?.user ?? null); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, profile, loading, configured: isSupabaseConfigured };
}
