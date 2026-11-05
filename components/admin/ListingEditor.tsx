'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Listing } from '@/types';

export default function ListingEditor({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [v, setV] = useState({ title: listing.title, description: listing.description, cultural_background: listing.cultural_background ?? '', practitioner_name: listing.practitioner_name ?? '',
    event_start: listing.event_start ?? '', event_end: listing.event_end ?? '', date_note: listing.date_note ?? '', verification_status: listing.verification_status, is_visible: listing.is_visible });
  const [msg, setMsg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v, val: string | boolean) => setV((p) => ({ ...p, [k]: val }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    if (v.title.trim().length < 3 || v.description.trim().length < 20) return setErr('Title and description are required.');
    if (v.event_start && v.event_end && v.event_end < v.event_start) return setErr('End date is before the start date.');
    setBusy(true);
    const { error } = await createClient().from('listings').update({ ...v, title: v.title.trim(), cultural_background: v.cultural_background || null, practitioner_name: v.practitioner_name || null,
      event_start: v.event_start || null, event_end: v.event_end || null, date_note: v.date_note || null }).eq('id', listing.id);
    setBusy(false); error ? setErr(error.message) : (setMsg('Saved.'), router.refresh());
  }
  const F = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => <div><label className="label" htmlFor={id}>{label}</label>{children}</div>;
  return (
    <form onSubmit={save} className="card max-w-2xl space-y-4 p-6">
      <F id="t" label="Title"><input id="t" className="input" value={v.title} onChange={(e) => set('title', e.target.value)} /></F>
      <F id="d" label="Description"><textarea id="d" rows={4} className="input" value={v.description} onChange={(e) => set('description', e.target.value)} /></F>
      <F id="b" label="Cultural background"><textarea id="b" rows={4} className="input" value={v.cultural_background} onChange={(e) => set('cultural_background', e.target.value)} /></F>
      <F id="p" label="Artist / organiser"><input id="p" className="input" value={v.practitioner_name} onChange={(e) => set('practitioner_name', e.target.value)} /></F>
      <div className="grid gap-4 sm:grid-cols-2"><F id="s" label="Event start"><input id="s" type="date" className="input" value={v.event_start} onChange={(e) => set('event_start', e.target.value)} /></F><F id="e" label="Event end"><input id="e" type="date" className="input" value={v.event_end} onChange={(e) => set('event_end', e.target.value)} /></F></div>
      <F id="n" label="Date note (for recurring or unconfirmed dates)"><input id="n" className="input" value={v.date_note} onChange={(e) => set('date_note', e.target.value)} /></F>
      <div className="grid gap-4 sm:grid-cols-2"><F id="vs" label="Verification status"><select id="vs" className="input" value={v.verification_status} onChange={(e) => set('verification_status', e.target.value)}><option value="demo">Demo</option><option value="unverified">Unverified</option><option value="under_review">Under review</option><option value="verified">Verified</option></select></F>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" className="accent-saffron-500" checked={v.is_visible} onChange={(e) => set('is_visible', e.target.checked)} />Visible to the public</label></div>
      {err && <p role="alert" className="error-text">{err}</p>}{msg && <p role="status" className="text-sm text-saffron-500">{msg}</p>}
      <button className="btn-saffron" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
