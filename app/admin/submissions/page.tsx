import Link from 'next/link';
import { StatusBadge } from '@/components/listings/Badges';
import { requireAdmin } from '@/lib/admin';
import { SUBMISSION_LABEL, TYPE_META } from '@/lib/listing-meta';
import type { Submission, SubmissionStatus } from '@/types';
export const metadata = { title: 'Submissions' };

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAdmin();
  const { status } = await searchParams;
  let q = supabase.from('submissions').select('*').order('created_at', { ascending: false });
  if (status && status in SUBMISSION_LABEL) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const subs = (data ?? []) as Submission[];
  return (
    <div><h1 className="text-4xl">Submissions</h1>
      <div className="my-5 flex flex-wrap gap-2 text-sm">{[['', 'All'], ...Object.entries(SUBMISSION_LABEL)].map(([k, v]) => <Link key={k} href={k ? `/admin/submissions?status=${k}` : '/admin/submissions'} className={`border px-3 py-1.5 ${(status ?? '') === k ? 'border-saffron-500 bg-saffron-500 text-crimson-950' : 'border-crimson-800'}`}>{v}</Link>)}</div>
      {subs.length === 0 ? <p className="card p-8 text-center text-cream-muted">No submissions in this view.</p> : <ul className="divide-y divide-crimson-800 border border-crimson-800">{subs.map((s) => (
        <li key={s.id}><Link href={`/admin/submissions/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-crimson-900"><span><span className="block font-semibold">{s.listing_data.title}</span><span className="text-xs text-cream-muted">{TYPE_META[s.listing_data.listing_type]?.label} · {new Date(s.created_at).toLocaleString('en-IN')}</span></span><StatusBadge status={s.status as SubmissionStatus} /></Link></li>))}</ul>}
    </div>
  );
}
