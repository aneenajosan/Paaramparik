import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import ReviewPanel from '@/components/admin/ReviewPanel';
import { StatusBadge } from '@/components/listings/Badges';
import { requireAdmin } from '@/lib/admin';
import { TYPE_META } from '@/lib/listing-meta';
import { haversineKm } from '@/lib/utils';
import type { Listing, Profile, Review, Submission } from '@/types';
export const metadata = { title: 'Review submission' };

export default async function SubmissionReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('submissions').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const s = data as Submission, d = s.listing_data;
  const [{ data: prof }, { data: hist }, { data: ls }, { data: others }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', s.contributor_id).maybeSingle(),
    supabase.from('reviews').select('*').eq('submission_id', id).order('created_at'),
    supabase.from('listings').select('id,title,slug,latitude,longitude'),
    supabase.from('submissions').select('id,listing_data,status').neq('id', id).in('status', ['pending_review', 'approved']),
  ]);
  const contributor = prof as Profile | null;
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const me = norm(d.title);
  const dupListings = ((ls ?? []) as Pick<Listing, 'id' | 'title' | 'slug' | 'latitude' | 'longitude'>[]).filter((l) =>
    norm(l.title) === me || (me.length > 4 && (norm(l.title).includes(me) || me.includes(norm(l.title)))) ||
    (d.latitude != null && d.longitude != null && haversineKm({ lat: d.latitude, lng: d.longitude }, { lat: l.latitude, lng: l.longitude }) < 0.3 && norm(l.title).split(' ')[0] === me.split(' ')[0]));
  const dupSubs = ((others ?? []) as Pick<Submission, 'id' | 'listing_data' | 'status'>[]).filter((o) => norm(o.listing_data.title) === me);
  const preview = d.latitude != null && d.longitude != null ? [{ id: 'x', title: d.title, slug: '#', listing_type: d.listing_type, latitude: d.latitude, longitude: d.longitude, description: d.description, location_name: d.location_name } as unknown as Listing] : [];
  const Row = ({ k, v }: { k: string; v?: string | null }) => v ? <div><dt className="text-xs uppercase tracking-wider text-cream-muted">{k}</dt><dd className="mt-0.5 whitespace-pre-wrap text-sm">{v}</dd></div> : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <div><Link href="/admin/submissions" className="text-sm text-cream-muted hover:text-saffron-500">← All submissions</Link>
          <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="text-4xl">{d.title}</h1><StatusBadge status={s.status} /></div>
          <p className="mt-1 text-sm text-cream-muted">{TYPE_META[d.listing_type]?.label} · submitted {new Date(s.created_at).toLocaleString('en-IN')}</p></div>

        {(dupListings.length > 0 || dupSubs.length > 0) && <div className="border border-saffron-500 bg-saffron-950 p-4 text-sm"><p className="flex items-center gap-2 font-semibold text-saffron-500"><AlertTriangle size={16} />Possible duplicates</p>
          <ul className="mt-2 list-disc pl-5">{dupListings.map((l) => <li key={l.id}>Published: <Link className="underline" href={`/listings/${l.slug}`}>{l.title}</Link></li>)}{dupSubs.map((o) => <li key={o.id}>Submission: <Link className="underline" href={`/admin/submissions/${o.id}`}>{o.listing_data.title}</Link> ({o.status.replace('_', ' ')})</li>)}</ul></div>}

        <dl className="card space-y-4 p-5"><Row k="Description" v={d.description} /><Row k="Cultural background" v={d.cultural_background} /><Row k="Artist / organiser" v={d.practitioner_name} />
          <Row k="Place" v={[d.location_name, d.district, d.address].filter(Boolean).join(' · ')} /><Row k="Coordinates" v={d.latitude != null ? `${d.latitude}, ${d.longitude}` : 'Missing'} />
          {(d.event_start || d.venue) && <Row k="Dates" v={`${d.event_start || '—'} → ${d.event_end || '—'} ${d.event_start_time || ''}${d.event_end_time ? '–' + d.event_end_time : ''}${d.venue ? ' · ' + d.venue : ''}`} />}
          <Row k="Participation" v={d.participation_info} /><Row k="Contributor’s note" v={d.contributor_note} />
          <Row k="Contact (as submitted)" v={Object.entries(d.contact_information ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')} /></dl>

        <section><h2 className="mb-3 text-2xl">Sources to check</h2>
          <ul className="space-y-2">{d.sources?.map((x) => <li key={x.source_url} className="card p-3 text-sm"><a href={x.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-saffron-500 hover:underline">{x.source_name}<ExternalLink size={12} /></a><span className="text-xs text-cream-muted">{x.source_type}{x.description ? ` — ${x.description}` : ''}</span></li>)}</ul></section>
        {d.images?.length > 0 && <section><h2 className="mb-3 text-2xl">Images</h2><ul className="flex flex-wrap gap-3">{d.images.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt={`Submitted by contributor for ${d.title}`} className="h-36 w-36 object-cover" /></a></li>)}</ul></section>}
        {preview.length > 0 && <section><h2 className="mb-3 text-2xl">Location check</h2><CultureMap listings={preview} height="300px" scrollZoom={false} /></section>}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {s.status === 'pending_review' ? <ReviewPanel submissionId={s.id} initialComments={s.admin_feedback ?? ''} /> : <div className="card p-5 text-sm"><h2 className="text-xl">Decision recorded</h2><p className="mt-2 text-cream-muted">This submission is {s.status.replace('_', ' ')}. Contributors resubmit after changes are requested.</p></div>}
        <div className="card p-5 text-sm"><h2 className="text-xl">Contributor</h2><p className="mt-2">{contributor?.full_name || '—'}</p><p className="text-cream-muted">{contributor?.email}</p>
          <Link href={`/admin/contributors/${s.contributor_id}`} className="mt-2 inline-block font-semibold text-saffron-500">View profile & history</Link></div>
        <div className="card p-5 text-sm"><h2 className="text-xl">Moderation history</h2>
          {((hist ?? []) as Review[]).length === 0 ? <p className="mt-2 text-cream-muted">No decisions yet.</p> : <ol className="mt-3 space-y-3">{((hist ?? []) as Review[]).map((r) => <li key={r.id} className="border-l-2 border-saffron-500 pl-3"><p className="font-semibold capitalize">{r.decision.replace('_', ' ')}</p><p className="text-xs text-cream-muted">{new Date(r.created_at).toLocaleString('en-IN')}</p>{r.comments && <p className="mt-1 whitespace-pre-wrap">{r.comments}</p>}</li>)}</ol>}</div>
      </aside>
    </div>
  );
}
