import Link from 'next/link';
import ListingAdminActions from '@/components/admin/ListingAdminActions';
import { requireAdmin } from '@/lib/admin';
import { TYPE_META } from '@/lib/listing-meta';
import type { Listing } from '@/types';
export const metadata = { title: 'Manage listings' };

export default async function AdminListings() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('listings').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  const listings = (data ?? []) as Listing[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div><h1 className="text-4xl">Published listings</h1><p className="mt-2 text-sm text-cream-muted">Edit details, change verification, hide or remove entries. Expired events are flagged.</p>
      {listings.length === 0 ? <p className="card mt-6 p-8 text-center text-cream-muted">No listings in the database yet. Approve a submission or run <code>supabase/seed.sql</code>.</p> : (
        <ul className="mt-6 divide-y divide-crimson-800 border border-crimson-800">{listings.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><Link href={`/admin/listings/${l.id}`} className="font-semibold hover:text-saffron-500">{l.title}</Link>
              <p className="text-xs text-cream-muted">{TYPE_META[l.listing_type].label} · {l.location_name}{!l.is_visible && ' · hidden'}{l.event_start && (l.event_end ?? l.event_start) < today && <span className="ml-1 font-semibold text-saffron-500">· event date has passed</span>}</p></div>
            <ListingAdminActions id={l.id} title={l.title} visible={l.is_visible} verification={l.verification_status} /></li>))}</ul>)}
    </div>
  );
}
