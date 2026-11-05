import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

/** Server-side admin gate used by every admin page. RLS enforces the same rule in the database. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = data as Profile | null;
  return { supabase, user, isAdmin: profile?.role === 'admin' };
}
