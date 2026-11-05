'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VerificationStatus } from '@/types';

export default function ListingAdminActions({ id, title, visible, verification }: { id: string; title: string; visible: boolean; verification: VerificationStatus }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setErr(null); setBusy(true); const { error } = await fn(); setBusy(false);
    error ? setErr(error.message) : router.refresh();
  }
  const sb = createClient();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="sr-only" htmlFor={`v-${id}`}>Verification status for {title}</label>
      <select id={`v-${id}`} className="input !w-auto !py-1" value={verification} disabled={busy} onChange={(e) => run(() => sb.from('listings').update({ verification_status: e.target.value }).eq('id', id))}>
        <option value="demo">Demo</option><option value="unverified">Unverified</option><option value="under_review">Under review</option><option value="verified">Verified</option></select>
      <button className="btn-ghost !py-1" disabled={busy} onClick={() => run(() => sb.from('listings').update({ is_visible: !visible }).eq('id', id))}>{visible ? 'Hide' : 'Show'}</button>
      <button className="btn-primary !py-1" disabled={busy} onClick={() => { if (confirm(`Permanently delete “${title}”? This removes its sources, media and connections.`)) run(() => sb.from('listings').delete().eq('id', id)); }}>Delete</button>
      {err && <span role="alert" className="error-text">{err}</span>}
    </div>
  );
}
