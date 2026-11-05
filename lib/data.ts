import demoListings from '@/data/listings.json';
import demoCategories from '@/data/categories.json';
import demoRelationships from '@/data/relationships.json';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import type { Category, Listing, RelatedListing, Relationship } from '@/types';

const demo = demoListings as unknown as Listing[];
const demoRels = demoRelationships as Relationship[];

export type DataSource = 'supabase' | 'demo';

/** Published, visible listings. Uses Supabase when configured, otherwise bundled DEMO data (never mixed). */
export async function getPublishedListings(): Promise<{ listings: Listing[]; source: DataSource }> {
  if (!isSupabaseConfigured) return { listings: demo, source: 'demo' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*, sources(*)')
    .not('published_at', 'is', null).eq('is_visible', true).order('title');
  if (error) throw new Error(`Could not load listings: ${error.message}`);
  return { listings: (data ?? []) as Listing[], source: 'supabase' };
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return demoCategories as Category[];
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return (data ?? []) as Category[];
}

export async function getListingBySlug(slug: string): Promise<{ listing: Listing | null; source: DataSource }> {
  if (!isSupabaseConfigured) return { listing: demo.find((l) => l.slug === slug) ?? null, source: 'demo' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*, sources(*)').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return { listing: (data as Listing) ?? null, source: 'supabase' };
}

/** Connected listings in either direction of the relationships table. */
export async function getRelated(listingId: string): Promise<RelatedListing[]> {
  let rels: Relationship[];
  let pool: Listing[];
  if (!isSupabaseConfigured) { rels = demoRels; pool = demo; } else {
    const supabase = await createClient();
    const { data, error } = await supabase.from('relationships').select('*')
      .or(`source_listing_id.eq.${listingId},related_listing_id.eq.${listingId}`);
    if (error) throw new Error(error.message);
    rels = (data ?? []) as Relationship[];
    const ids = rels.map((r) => (r.source_listing_id === listingId ? r.related_listing_id : r.source_listing_id));
    if (!ids.length) return [];
    const res = await supabase.from('listings').select('*, sources(*)').in('id', ids);
    if (res.error) throw new Error(res.error.message);
    pool = (res.data ?? []) as Listing[];
  }
  return rels
    .filter((r) => r.source_listing_id === listingId || r.related_listing_id === listingId)
    .map((r) => {
      const otherId = r.source_listing_id === listingId ? r.related_listing_id : r.source_listing_id;
      const listing = pool.find((l) => l.id === otherId);
      return listing ? { listing, relationship_type: r.relationship_type, description: r.description } : null;
    })
    .filter((x): x is RelatedListing => x !== null);
}
