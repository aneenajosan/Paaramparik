import Link from 'next/link';
import { StatusBadge } from '@/components/listings/Badges';
import { requireAdmin } from '@/lib/admin';
import type { Profile, Submission } from '@/types';
export const metadata = { title: 'Admin dashboard' };

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => { const r = await q; if (r.error) throw new Error(r.error.message); return r.count ?? 0; };
  const [published, pending, approved, rejected, changes] = await Promise.all([
    count(supabase.from('listings').select('*', { count: 'exact', head: true }).not('published_at', 'is', null)),
    count(supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending_review')),
    count(supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved')),
    count(supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected')),
    count(supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'changes_requested')),
  ]);
  const { data: recentData } = await supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(100);
  const recent = (recentData ?? []) as Submission[];
  const { data: profs } = await supabase.from('profiles').select('id,full_name,email');
  const names = Object.fromEntries(((profs ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]).map((p) => [p.id, p.full_name || p.email || 'Unknown']));
  const activity = Object.entries(recent.reduce<Record<string, number>>((a, s) => ((a[s.contributor_id] = (a[s.contributor_id] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const cards: [string, number, string][] = [['Published listings', published, '/admin/listings'], ['Pending review', pending, '/admin/submissions?status=pending_review'], ['Changes requested', changes, '/admin/submissions?status=changes_requested'], ['Approved submissions', approved, '/admin/submissions?status=approved'], ['Rejected submissions', rejected, '/admin/submissions?status=rejected']];

  return (
    <div className="space-y-10">
      <h1 className="text-4xl">Moderation overview</h1>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(([l, n, h]) => <Link key={l} href={h} className="card p-4 hover:border-saffron-500"><dt className="text-xs uppercase tracking-wider text-cream-muted">{l}</dt><dd className="font-display text-4xl font-bold text-saffron-500">{n}</dd></Link>)}</dl>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section><h2 className="mb-3 text-2xl">Recently submitted</h2>
          {recent.length === 0 ? <p className="card p-6 text-sm text-cream-muted">No submissions yet.</p> : <ul className="divide-y divide-crimson-800 border border-crimson-800">{recent.slice(0, 8).map((s) => (
            <li key={s.id}><Link href={`/admin/submissions/${s.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-crimson-900"><span><span className="block font-semibold">{s.listing_data.title}</span><span className="text-xs text-cream-muted">{names[s.contributor_id]} · {new Date(s.created_at).toLocaleDateString('en-IN')}</span></span><StatusBadge status={s.status} /></Link></li>))}</ul>}</section>
        <section><h2 className="mb-3 text-2xl">Contributor activity</h2>
          {activity.length === 0 ? <p className="card p-6 text-sm text-cream-muted">No activity yet.</p> : <ul className="card divide-y divide-crimson-800">{activity.map(([id, n]) => <li key={id}><Link href={`/admin/contributors/${id}`} className="flex justify-between p-3 text-sm hover:text-saffron-500"><span>{names[id]}</span><span className="font-semibold">{n}</span></Link></li>)}</ul>}
          <p className="hint">Submissions among the latest 100.</p></section>
      </div>
    </div>
  );
}
