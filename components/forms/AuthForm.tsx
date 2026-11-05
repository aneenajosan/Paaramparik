'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/dashboard';
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.');
    setBusy(true);
    const supabase = createClient();
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
      router.push(next.startsWith('/') ? next : '/dashboard'); router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${location.origin}/login` } });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) { router.push('/dashboard'); router.refresh(); }
      else setInfo('Check your email to confirm your account, then log in.');
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md space-y-4 p-8" noValidate>
      <h1 className="text-3xl">{mode === 'login' ? 'Welcome back' : 'Join the map'}</h1>
      {mode === 'signup' && <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {error && <p role="alert" className="error-text">{error}</p>}
      {info && <p role="status" className="text-sm text-saffron-500">{info}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      <p className="text-center text-sm text-cream-muted">{mode === 'login' ? <>New here? <Link className="font-semibold text-saffron-500" href="/signup">Create an account</Link></> : <>Already registered? <Link className="font-semibold text-saffron-500" href="/login">Log in</Link></>}</p>
    </form>
  );
}
