import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConfigNotice from '@/components/ConfigNotice';
import { StatusBadge } from '@/components/listings/Badges';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { TYPE_META } from '@/lib/listing-meta';
import type { Review, Submission } from '@/types';
export const metadata = { title: 'My submissions' };
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  if (!isSupabaseConfigured) return <ConfigNotice feature="Submission tracking" />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');
  const { data, error } = await supabase.from('submissions').select('*').eq('contributor_id', user.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const subs = (data ?? []) as Submission[];
  const listingIds = subs.map((s) => s.listing_id).filter(Boolean) as string[];
  const [{ data: ls }, { data: rv }] = await Promise.all([
    listingIds.length ? supabase.from('listings').select('id,slug').in('id', listingIds) : Promise.resolve({ data: [] as { id: string; slug: string }[] }),
    subs.length ? supabase.from('reviews').select('*').in('submission_id', subs.map((s) => s.id)).order('created_at') : Promise.resolve({ data: [] as Review[] }),
  ]);
  const slugs = Object.fromEntries((ls ?? []).map((l) => [l.id, l.slug]));
  const counts = (st: string) => subs.filter((s) => s.status === st).length;

  return (
    <div className="container-page section">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Contributor dashboard</p><h1 className="mt-1 text-4xl">My submissions</h1></div><Link href="/contribute" className="btn-saffron">New submission</Link></div>
      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{(['pending_review', 'approved', 'changes_requested', 'rejected'] as const).map((s) => <div key={s} className="card p-4"><dt className="text-xs uppercase tracking-wider text-cream-muted">{s.replace('_', ' ')}</dt><dd className="font-display text-3xl font-bold">{counts(s)}</dd></div>)}</dl>
      {subs.length === 0 ? <div className="card p-10 text-center text-cream-muted">You haven’t submitted anything yet. <Link className="font-semibold text-saffron-500 underline" href="/contribute">Add your first listing.</Link></div> : (
        <ul className="space-y-4">{subs.map((s) => { const hist = (rv ?? []).filter((r) => r.submission_id === s.id); return (
          <li key={s.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs uppercase tracking-wider text-cream-muted">{TYPE_META[s.listing_data.listing_type]?.label} · submitted {new Date(s.created_at).toLocaleDateString('en-IN')}</p><h2 className="mt-1 text-xl font-bold">{s.listing_data.title}</h2></div><StatusBadge status={s.status} /></div>
            {s.admin_feedback && <div className="mt-4 border-l-4 border-saffron-500 bg-saffron-950 p-3 text-sm"><p className="font-semibold text-saffron-500">Administrator feedback</p><p className="mt-1 whitespace-pre-wrap">{s.admin_feedback}</p></div>}
            {hist.length > 1 && <p className="mt-2 text-xs text-cream-muted">{hist.length} review decisions recorded.</p>}
            <div className="mt-4 flex gap-3 text-sm">
              {(s.status === 'changes_requested' || s.status === 'pending_review') && <Link className="btn-ghost !py-1.5" href={`/contribute?edit=${s.id}`}>{s.status === 'changes_requested' ? 'Edit & resubmit' : 'Edit'}</Link>}
              {s.status === 'approved' && s.listing_id && slugs[s.listing_id] && <Link className="btn-ghost !py-1.5" href={`/listings/${slugs[s.listing_id]}`}>View published listing</Link>}</div></li>); })}</ul>)}
    </div>
  );
}
