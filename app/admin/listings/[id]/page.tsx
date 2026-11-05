import Link from 'next/link';
import { notFound } from 'next/navigation';
import ListingEditor from '@/components/admin/ListingEditor';
import { requireAdmin } from '@/lib/admin';
import type { Listing } from '@/types';
export const metadata = { title: 'Edit listing' };
export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const l = data as Listing;
  return (<div><Link href="/admin/listings" className="text-sm text-cream-muted hover:text-saffron-500">← Published listings</Link><h1 className="mb-6 mt-3 text-4xl">Edit: {l.title}</h1><ListingEditor listing={l} /></div>);
}
