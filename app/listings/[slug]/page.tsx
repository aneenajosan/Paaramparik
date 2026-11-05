import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Mail, Phone, Globe, CalendarDays, Clock, MapPin, BookOpen } from 'lucide-react';
import CultureMap from '@/components/map/CultureMap';
import CoverArt from '@/components/listings/CoverArt';
import ReportMisinformationModal from '@/components/listings/ReportMisinformationModal';
import { TypeBadge, VerificationBadge } from '@/components/listings/Badges';
import RelatedListings from '@/components/listings/RelatedListings';
import DemoBanner from '@/components/listings/DemoBanner';
import { getCategories, getListingBySlug, getRelated } from '@/lib/data';
import { EXPERIENCE_LABEL } from '@/lib/listing-meta';
import { eventLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { listing } = await getListingBySlug((await params).slug);
  return { title: listing?.title ?? 'Listing' };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { listing, source } = await getListingBySlug(slug);
  if (!listing) notFound();
  const [related, categories] = await Promise.all([getRelated(listing.id), getCategories()]);
  const category = categories.find((c) => c.id === listing.category_id);
  const c = listing.contact_information ?? {};
  const hasContact = c.website || c.email || c.phone || c.social;
  const when = eventLabel(listing);
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-3 mt-12 border-b border-crimson-800 pb-2 text-2xl">{children}</h2>;

  return (
    <>
      {source === 'demo' && <DemoBanner />}
      <div className="container-page py-8">
        <Link href="/directory" className="inline-flex items-center gap-1 text-sm text-cream-muted hover:text-saffron-500"><ArrowLeft size={14} /> Back to directory</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <article>
            <TypeBadge type={listing.listing_type} />
            <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{listing.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3"><VerificationBadge status={listing.verification_status} />{category && <span className="text-sm text-cream-muted">{category.name}</span>}</div>
            <div className="mt-6 overflow-hidden"><CoverArt listing={listing} className="h-64" /></div>
            <p className="mt-6 text-lg leading-relaxed">{listing.description}</p>

            <H>Cultural & historical background</H>
            <p className="leading-relaxed text-cream/90">{listing.cultural_background || 'No background has been written for this listing yet.'}</p>

            {(when || listing.venue || listing.participation_info) && <>
              <H>Dates & participation</H>
              <ul className="space-y-2 text-sm">
                {when && <li className="flex gap-2"><CalendarDays size={16} className="mt-0.5 text-saffron-500" />{when}{listing.event_start_time && <span className="flex items-center gap-1 text-cream-muted"><Clock size={13} />{listing.event_start_time.slice(0, 5)}{listing.event_end_time && `–${listing.event_end_time.slice(0, 5)}`}</span>}</li>}
                {listing.date_note && <li className="text-cream-muted">{listing.date_note}</li>}
                {listing.venue && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-saffron-500" />{listing.venue}</li>}
                {listing.participation_info && <li className="text-cream-muted">{listing.participation_info}</li>}
              </ul></>}

            <H>Location</H>
            <p className="mb-3 flex items-center gap-2 text-sm"><MapPin size={16} className="text-saffron-500" />{[listing.location_name, listing.district, listing.address].filter(Boolean).join(' · ')}<span className="text-cream-muted">({listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)})</span></p>
            <CultureMap listings={[listing]} height="300px" scrollZoom={false} />

            <H>Sources & verification</H>
            {listing.verification_status !== 'verified' && <p className="mb-3 border border-saffron-500/50 bg-saffron-950 p-3 text-sm text-cream-muted">This listing has not been reviewed by a Living Culture Map administrator. Treat it as a starting point and check the sources.</p>}
            {listing.sources?.length ? <ul className="space-y-3">{listing.sources.map((s) => (
              <li key={s.source_url} className="card p-4"><a href={s.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-saffron-500 hover:underline"><BookOpen size={14} />{s.source_name}<ExternalLink size={12} /></a>
                {s.description && <p className="mt-1 text-sm text-cream-muted">{s.description}</p>}</li>))}</ul> : <p className="text-sm text-cream-muted">No sources recorded.</p>}

            <H>Connected cultural experiences</H>
            <RelatedListings related={related} />
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5"><h2 className="text-lg">At a glance</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {listing.experience_type && <div><dt className="text-cream-muted">Experience</dt><dd>{EXPERIENCE_LABEL[listing.experience_type]}</dd></div>}
                {listing.practitioner_name && <div><dt className="text-cream-muted">Artist / organiser</dt><dd>{listing.practitioner_name}</dd></div>}
                <div><dt className="text-cream-muted">District</dt><dd>{listing.district ?? '—'}</dd></div></dl></div>
            <div className="card p-5"><h2 className="text-lg">Contact & links</h2>
              {hasContact || listing.external_links?.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {c.website && <li><a className="flex items-center gap-2 hover:text-saffron-500" href={c.website} target="_blank" rel="noopener noreferrer"><Globe size={14} />Website</a></li>}
                  {c.email && <li><a className="flex items-center gap-2 hover:text-saffron-500" href={`mailto:${c.email}`}><Mail size={14} />{c.email}</a></li>}
                  {c.phone && <li><a className="flex items-center gap-2 hover:text-saffron-500" href={`tel:${c.phone}`}><Phone size={14} />{c.phone}</a></li>}
                  {c.social && <li><a className="flex items-center gap-2 hover:text-saffron-500" href={c.social} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Public profile</a></li>}
                  {listing.external_links?.map((l) => <li key={l.url}><a className="flex items-center gap-2 hover:text-saffron-500" href={l.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />{l.label}</a></li>)}
                </ul>) : <p className="mt-3 text-sm text-cream-muted">No contact details have been verified for this listing. Contact details are never invented.</p>}</div>
            <div className="card p-5 text-sm">
              <h2 className="text-lg">Spot a mistake?</h2>
              <p className="mt-2 text-cream-muted">Notice incorrect dates, location, or misleading descriptions?</p>
              <div className="mt-3 space-y-2">
                <ReportMisinformationModal eventId={listing.id} eventTitle={listing.title} />
                <Link href="/contribute" className="btn-ghost block text-center w-full">Contribute an update</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
