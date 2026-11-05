'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, ImagePlus, Info } from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';
import { TYPE_META, TYPES, EXPERIENCE_FOR_TYPE } from '@/lib/listing-meta';
import { validateSubmission, type Errors } from '@/lib/validation';
import { createClient } from '@/lib/supabase/client';
import type { Category, ListingType, Submission, SubmissionData } from '@/types';

const emptyData = (t: ListingType): SubmissionData => ({
  listing_type: t, title: '', category_id: '', description: '', cultural_background: '', district: '', location_name: '', address: '',
  latitude: null, longitude: null, practitioner_name: '', experience_type: EXPERIENCE_FOR_TYPE[t], contact_information: {}, external_links: [],
  event_start: '', event_end: '', event_start_time: '', event_end_time: '', venue: '', participation_info: '',
  sources: [{ source_name: '', source_url: '', source_type: 'reference', description: '' }], images: [], contributor_note: '',
});
const MAX_IMG = 4, MAX_MB = 5;

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
  return <div><label className="label" htmlFor={id}>{label}</label>{children}{hint && !error && <p className="hint">{hint}</p>}{error && <p role="alert" className="error-text">{error}</p>}</div>;
}

export default function ContributionForm({ categories, editId }: { categories: Category[]; editId?: string }) {
  const [type, setType] = useState<ListingType | null>(null);
  const [d, setD] = useState<SubmissionData>(emptyData('place'));
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false), [fatal, setFatal] = useState<string | null>(null), [done, setDone] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId)), [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    createClient().from('submissions').select('*').eq('id', editId).maybeSingle().then(({ data, error }) => {
      const s = data as Submission | null;
      if (error || !s) setFatal(error?.message ?? 'Submission not found.');
      else if (!['changes_requested', 'pending_review'].includes(s.status)) setFatal('This submission can no longer be edited.');
      else { setD({ ...emptyData(s.listing_data.listing_type), ...s.listing_data }); setType(s.listing_data.listing_type); setFeedback(s.admin_feedback); }
      setLoading(false);
    });
  }, [editId]);

  const set = <K extends keyof SubmissionData>(k: K, v: SubmissionData[K]) => setD((p) => ({ ...p, [k]: v }));
  const setContact = (k: string, v: string) => setD((p) => ({ ...p, contact_information: { ...p.contact_information, [k]: v } }));
  const chooseType = (t: ListingType) => { setType(t); setD(emptyData(t)); };
  const hasDates = type === 'event' || type === 'performance' || type === 'workshop';

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files]; const msgs: string[] = [];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith('image/')) msgs.push(`${f.name} is not an image.`);
      else if (f.size > MAX_MB * 1024 * 1024) msgs.push(`${f.name} is larger than ${MAX_MB} MB.`);
      else if (next.length + d.images.length >= MAX_IMG) msgs.push(`Up to ${MAX_IMG} images are allowed.`);
      else next.push(f);
    }
    setFiles(next); setErrors((e) => ({ ...e, images: msgs.join(' ') || undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setFatal(null);
    const cleaned: SubmissionData = { ...d, sources: d.sources.filter((s) => s.source_name.trim() || s.source_url.trim()), external_links: d.external_links.filter((l) => l.url.trim()) };
    const errs = validateSubmission(cleaned);
    setErrors(errs);
    if (Object.keys(errs).length) { document.getElementById('form-errors')?.focus(); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session has expired. Please log in again.');
      const urls: string[] = [];
      for (const f of files) {
        const path = `${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const up = await supabase.storage.from('listing-media').upload(path, f, { contentType: f.type });
        if (up.error) throw new Error(`Image upload failed: ${up.error.message}`);
        urls.push(supabase.storage.from('listing-media').getPublicUrl(path).data.publicUrl);
      }
      const payload = { ...cleaned, images: [...cleaned.images, ...urls] };
      const res = editId
        ? await supabase.from('submissions').update({ listing_data: payload, status: 'pending_review' }).eq('id', editId)
        : await supabase.from('submissions').insert({ contributor_id: user.id, listing_data: payload, status: 'pending_review' });
      if (res.error) throw new Error(res.error.message);
      setDone(true);
    } catch (err) { setFatal(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  if (loading) return <p role="status" className="text-cream-muted">Loading submission…</p>;
  if (done) return (
    <div className="card mx-auto max-w-xl p-10 text-center"><CheckCircle2 size={40} className="mx-auto text-saffron-500" />
      <h2 className="mt-3 text-3xl">Thank you — submitted for review</h2>
      <p className="mt-3 text-cream-muted">Your listing is <strong className="text-cream">not published yet</strong>. An administrator will check the details and sources, then approve it, request changes or decline it. Track progress any time.</p>
      <Link href="/dashboard" className="btn-saffron mt-6">View my submissions</Link></div>);
  if (fatal && !type) return <p role="alert" className="error-text">{fatal}</p>;

  if (!type) return (
    <div><h2 className="text-2xl">What would you like to add?</h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{TYPES.map((t) => { const { Icon, label, blurb, color } = TYPE_META[t]; return (
        <li key={t}><button onClick={() => chooseType(t)} className="card flex h-full w-full flex-col items-start gap-2 p-5 text-left hover:border-saffron-500"><Icon style={{ color }} /><span className="font-display text-lg font-bold">{label}</span><span className="text-sm text-cream-muted">{blurb}</span></button></li>); })}</ul></div>);

  const errList = Object.values(errors).filter(Boolean) as string[];
  return (
    <form onSubmit={submit} className="space-y-10" noValidate>
      <div className="flex items-start gap-3 border border-saffron-500/60 bg-saffron-950 p-4 text-sm"><Info size={18} className="mt-0.5 shrink-0 text-saffron-500" /><p>Submitting a <strong>{TYPE_META[type].label}</strong>. Everything is reviewed by an administrator before it appears publicly. Only include facts you can support with a source, and only publish contact details the person or organisation already makes public.</p></div>
      {feedback && editId && <div className="border border-saffron-500 p-4 text-sm"><p className="font-semibold text-saffron-500">Administrator feedback</p><p className="mt-1 whitespace-pre-wrap">{feedback}</p></div>}
      {errList.length > 0 && <div id="form-errors" tabIndex={-1} role="alert" className="border border-crimson-500 bg-crimson-900 p-4 text-sm"><p className="font-semibold">Please fix {errList.length} {errList.length === 1 ? 'problem' : 'problems'}:</p><ul className="mt-1 list-disc pl-5">{errList.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}

      <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">The basics</legend>
        <Field label="Name *" id="title" error={errors.title}><input id="title" className="input" value={d.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Art-form category *" id="cat" error={errors.category_id}><select id="cat" className="input" value={d.category_id} onChange={(e) => set('category_id', e.target.value)}><option value="">Choose…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Description *" id="desc" error={errors.description} hint="What is it, in plain words? Minimum 40 characters."><textarea id="desc" rows={4} className="input" value={d.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Cultural & historical background" id="bg" hint="Only what your sources support."><textarea id="bg" rows={4} className="input" value={d.cultural_background} onChange={(e) => set('cultural_background', e.target.value)} /></Field>
        <Field label={type === 'artist' ? 'Artist / practitioner name' : 'Artist, practitioner or organiser'} id="prac"><input id="prac" className="input" value={d.practitioner_name} onChange={(e) => set('practitioner_name', e.target.value)} /></Field>
      </fieldset>

      <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">Location</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="District *" id="dist" error={errors.district}><input id="dist" className="input" value={d.district} onChange={(e) => set('district', e.target.value)} /></Field>
          <Field label="Locality / village / town" id="loc"><input id="loc" className="input" value={d.location_name} onChange={(e) => set('location_name', e.target.value)} /></Field></div>
        <Field label="Address" id="addr"><input id="addr" className="input" value={d.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <div><p className="label">Pin the location *</p><LocationPicker lat={d.latitude} lng={d.longitude} onPick={(la, lo) => setD((p) => ({ ...p, latitude: la, longitude: lo }))} />
          {errors.location && <p role="alert" className="error-text">{errors.location}</p>}
          <div className="mt-3 grid grid-cols-2 gap-4"><Field label="Latitude" id="lat"><input id="lat" type="number" step="any" className="input" value={d.latitude ?? ''} onChange={(e) => set('latitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
            <Field label="Longitude" id="lng"><input id="lng" type="number" step="any" className="input" value={d.longitude ?? ''} onChange={(e) => set('longitude', e.target.value === '' ? null : Number(e.target.value))} /></Field></div></div>
      </fieldset>

      {hasDates && <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">Dates & participation</legend>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={type === 'event' ? 'Start date *' : 'Start date'} id="es" error={errors.event_start}><input id="es" type="date" className="input" value={d.event_start} onChange={(e) => set('event_start', e.target.value)} /></Field>
          <Field label="End date" id="ee" error={errors.event_end}><input id="ee" type="date" className="input" value={d.event_end} onChange={(e) => set('event_end', e.target.value)} /></Field>
          <Field label="Start time" id="est"><input id="est" type="time" className="input" value={d.event_start_time} onChange={(e) => set('event_start_time', e.target.value)} /></Field>
          <Field label="End time" id="eet"><input id="eet" type="time" className="input" value={d.event_end_time} onChange={(e) => set('event_end_time', e.target.value)} /></Field></div>
        <Field label="Venue" id="ven"><input id="ven" className="input" value={d.venue} onChange={(e) => set('venue', e.target.value)} /></Field>
        <Field label="Registration or participation information" id="part"><textarea id="part" rows={2} className="input" value={d.participation_info} onChange={(e) => set('participation_info', e.target.value)} /></Field></fieldset>}

      <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">Contact & links</legend>
        <p className="hint">Only public contact details the person or organisation already shares publicly. Do not copy private information from social media.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website" id="web" error={errors.website}><input id="web" type="url" className="input" placeholder="https://" value={d.contact_information.website ?? ''} onChange={(e) => setContact('website', e.target.value)} /></Field>
          <Field label="Public email" id="mail" error={errors.email}><input id="mail" type="email" className="input" value={d.contact_information.email ?? ''} onChange={(e) => setContact('email', e.target.value)} /></Field>
          <Field label="Public phone" id="ph"><input id="ph" type="tel" className="input" value={d.contact_information.phone ?? ''} onChange={(e) => setContact('phone', e.target.value)} /></Field>
          <Field label="Public social profile URL" id="soc"><input id="soc" type="url" className="input" placeholder="https://" value={d.contact_information.social ?? ''} onChange={(e) => setContact('social', e.target.value)} /></Field></div>
        {d.external_links.map((l, i) => (<div key={i} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-2"><input aria-label={`Link ${i + 1} label`} className="input" placeholder="Label" value={l.label} onChange={(e) => set('external_links', d.external_links.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
          <div><input aria-label={`Link ${i + 1} URL`} className="input" placeholder="https://" value={l.url} onChange={(e) => set('external_links', d.external_links.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />{errors[`link${i}`] && <p role="alert" className="error-text">{errors[`link${i}`]}</p>}</div>
          <button type="button" className="btn-ghost !px-3" aria-label="Remove link" onClick={() => set('external_links', d.external_links.filter((_, j) => j !== i))}><Trash2 size={14} /></button></div>))}
        <button type="button" className="btn-ghost" onClick={() => set('external_links', [...d.external_links, { label: '', url: '' }])}><Plus size={14} /> Add external link</button>
      </fieldset>

      <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">Sources *</legend>
        <p className="hint">Reviewers check these. Link to the pages your information came from.</p>
        {errors.sources && <p role="alert" className="error-text">{errors.sources}</p>}
        {d.sources.map((s, i) => (<div key={i} className="card space-y-2 p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]"><input aria-label={`Source ${i + 1} name`} className="input" placeholder="Source name" value={s.source_name} onChange={(e) => set('sources', d.sources.map((x, j) => j === i ? { ...x, source_name: e.target.value } : x))} />
            <input aria-label={`Source ${i + 1} URL`} className="input" placeholder="https://" value={s.source_url} onChange={(e) => set('sources', d.sources.map((x, j) => j === i ? { ...x, source_url: e.target.value } : x))} />
            <button type="button" className="btn-ghost !px-3" aria-label="Remove source" onClick={() => set('sources', d.sources.filter((_, j) => j !== i))}><Trash2 size={14} /></button></div>
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><select aria-label={`Source ${i + 1} type`} className="input" value={s.source_type ?? 'reference'} onChange={(e) => set('sources', d.sources.map((x, j) => j === i ? { ...x, source_type: e.target.value } : x))}>
            {['reference', 'official', 'news', 'academic', 'organiser', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <input aria-label={`Source ${i + 1} note`} className="input" placeholder="What does this source support?" value={s.description ?? ''} onChange={(e) => set('sources', d.sources.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></div>
          {errors[`source${i}`] && <p role="alert" className="error-text">{errors[`source${i}`]}</p>}</div>))}
        <button type="button" className="btn-ghost" onClick={() => set('sources', [...d.sources, { source_name: '', source_url: '', source_type: 'reference', description: '' }])}><Plus size={14} /> Add source</button>
      </fieldset>

      <fieldset className="space-y-3"><legend className="mb-2 text-xl font-bold">Images</legend>
        <p className="hint">Up to {MAX_IMG} images, {MAX_MB} MB each. Only upload photos you took or have permission to share.</p>
        <label className="btn-ghost cursor-pointer"><ImagePlus size={16} /> Choose images<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} /></label>
        {errors.images && <p role="alert" className="error-text">{errors.images}</p>}
        <ul className="flex flex-wrap gap-3">
          {d.images.map((u, i) => <li key={u} className="relative"><img src={u} alt="" className="h-24 w-24 object-cover" /><button type="button" aria-label="Remove image" className="absolute right-0 top-0 bg-crimson-950 p-1" onClick={() => set('images', d.images.filter((_, j) => j !== i))}><Trash2 size={12} /></button></li>)}
          {files.map((f, i) => <li key={i} className="relative"><img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-24 object-cover" /><button type="button" aria-label={`Remove ${f.name}`} className="absolute right-0 top-0 bg-crimson-950 p-1" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Trash2 size={12} /></button></li>)}
        </ul></fieldset>

      <fieldset className="space-y-4"><legend className="mb-2 text-xl font-bold">About you</legend>
        <Field label="Your connection to this culture or place" id="cn" hint="Optional. Helps reviewers understand your local knowledge. Your name and email stay private."><textarea id="cn" rows={2} className="input" value={d.contributor_note} onChange={(e) => set('contributor_note', e.target.value)} /></Field></fieldset>

      {fatal && <p role="alert" className="error-text">{fatal}</p>}
      <div className="flex flex-wrap gap-3"><button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : editId ? 'Resubmit for review' : 'Submit for review'}</button>
        {!editId && <button type="button" className="btn-ghost" onClick={() => setType(null)}>Change listing type</button>}</div>
    </form>
  );
}
