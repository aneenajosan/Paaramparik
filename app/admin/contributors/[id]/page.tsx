import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/listings/Badges';
import { requireAdmin } from '@/lib/admin';
import type { Profile, Submission } from '@/types';
export const metadata = { title: 'Contributor' };
export default async function ContributorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: p }, { data: s }] = await Promise.all([supabase.from('profiles').select('*').eq('id', id).maybeSingle(), supabase.from('submissions').select('*').eq('contributor_id', id).order('created_at', { ascending: false })]);
  if (!p) notFound();
  const c = p as Profile; const subs = (s ?? []) as Submission[];
  return (<div><Link href="/admin/contributors" className="text-sm text-cream-muted hover:text-saffron-500">← Contributors</Link>
    <h1 className="mt-3 text-4xl">{c.full_name || c.email}</h1><p className="text-sm text-cream-muted">{c.email} · {c.role} · joined {new Date(c.created_at).toLocaleDateString('en-IN')}</p>
    <h2 className="mb-3 mt-8 text-2xl">Submissions</h2>
    {subs.length === 0 ? <p className="card p-6 text-sm text-cream-muted">No submissions yet.</p> : <ul className="divide-y divide-crimson-800 border border-crimson-800">{subs.map((x) => <li key={x.id}><Link href={`/admin/submissions/${x.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-crimson-900"><span className="font-semibold">{x.listing_data.title}</span><StatusBadge status={x.status} /></Link></li>)}</ul>}</div>);
}
