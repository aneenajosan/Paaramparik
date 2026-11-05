import Link from 'next/link';
import RoleSelect from '@/components/admin/RoleSelect';
import { requireAdmin } from '@/lib/admin';
import type { Profile } from '@/types';
export const metadata = { title: 'Contributors' };
export default async function Contributors() {
  const { supabase, user } = await requireAdmin();
  const [{ data: p, error }, { data: s }] = await Promise.all([supabase.from('profiles').select('*').order('created_at', { ascending: false }), supabase.from('submissions').select('contributor_id,status')]);
  if (error) throw new Error(error.message);
  const profiles = (p ?? []) as Profile[];
  const tally = (id: string, st?: string) => (s ?? []).filter((x) => x.contributor_id === id && (!st || x.status === st)).length;
  return (
    <div><h1 className="text-4xl">Contributors</h1><p className="mt-2 text-sm text-cream-muted">Promote people with strong local knowledge to Trusted contributor. Only admins can change roles.</p>
      <div className="mt-6 overflow-x-auto border border-crimson-800"><table className="w-full text-left text-sm"><thead className="bg-crimson-900 text-xs uppercase tracking-wider text-cream-muted"><tr><th className="p-3">Name</th><th>Email</th><th>Submitted</th><th>Approved</th><th>Role</th></tr></thead>
        <tbody className="divide-y divide-crimson-800">{profiles.map((c) => (
          <tr key={c.id}><td className="p-3"><Link href={`/admin/contributors/${c.id}`} className="font-semibold hover:text-saffron-500">{c.full_name || '—'}</Link></td><td>{c.email}</td><td>{tally(c.id)}</td><td>{tally(c.id, 'approved')}</td>
            <td className="py-2">{c.id === user.id ? <span className="text-cream-muted">Admin (you)</span> : <RoleSelect id={c.id} role={c.role} name={c.full_name || c.email || 'user'} />}</td></tr>))}</tbody></table></div>
    </div>
  );
}
