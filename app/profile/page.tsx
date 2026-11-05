'use client';
import { useEffect, useState } from 'react';
import ConfigNotice from '@/components/ConfigNotice';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { user, profile, loading, configured } = useAuth();
  const [name, setName] = useState(''), [msg, setMsg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => setName(profile?.full_name ?? ''), [profile]);
  if (!configured) return <ConfigNotice feature="Profiles" />;
  if (loading) return <div className="container-page section" role="status">Loading…</div>;
  if (!user) return <div className="container-page section">Please <a className="text-saffron-500 underline" href="/login?next=/profile">log in</a>.</div>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    const { error } = await createClient().from('profiles').update({ full_name: name.trim() }).eq('id', user!.id);
    error ? setErr(error.message) : setMsg('Profile saved.');
  }
  return (
    <div className="container-page section"><form onSubmit={save} className="card mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-3xl">Your profile</h1>
      <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><p className="label">Email</p><p className="text-sm text-cream-muted">{user.email}</p></div>
      <div><p className="label">Role</p><p className="text-sm capitalize text-cream-muted">{profile?.role ?? 'user'}</p></div>
      {msg && <p role="status" className="text-sm text-saffron-500">{msg}</p>}{err && <p role="alert" className="error-text">{err}</p>}
      <button className="btn-primary">Save</button></form></div>
  );
}
