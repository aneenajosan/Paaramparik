import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
const NAV = [['/admin', 'Dashboard'], ['/admin/submissions', 'Submissions'], ['/admin/listings', 'Published listings'], ['/admin/contributors', 'Contributors']];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <ConfigNotice feature="The admin interface" />;
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return (
    <div className="container-page section"><div className="card mx-auto max-w-lg p-8 text-center"><ShieldAlert className="mx-auto text-saffron-500" /><h1 className="mt-3 text-2xl">Administrators only</h1>
      <p className="mt-2 text-sm text-cream-muted">Your account does not have the admin role.</p><Link href="/" className="btn-ghost mt-5">Back to the map</Link></div></div>);
  return (
    <div className="container-page py-8">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-crimson-800 pb-3"><span className="eyebrow mr-4">Admin</span>
        {NAV.map(([h, l]) => <Link key={h} href={h} className="px-3 py-1.5 text-sm font-semibold hover:text-saffron-500">{l}</Link>)}</div>
      {children}
    </div>
  );
}
