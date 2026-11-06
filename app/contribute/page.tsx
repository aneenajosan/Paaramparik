import { Suspense } from 'react';
import EventCreationWizard from '@/components/forms/EventCreationWizard';

export const metadata = { title: 'Create Cultural Event — Paaramparik' };
export const dynamic = 'force-dynamic';

export default async function ContributePage() {
  return (
    <div className="container-page section max-w-4xl">
      <div className="mb-6 text-center">
        <p className="eyebrow !text-saffron-600 font-semibold tracking-wider">Community Submission</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold font-display text-crimson-950">Create a Cultural Event</h1>
        <p className="mt-2 text-sm text-stone-600 max-w-xl mx-auto">
          Share your traditional performances, temple festivals, workshops, and gatherings with the community.
        </p>
      </div>

      <Suspense fallback={<p className="text-center text-stone-500">Loading creation form...</p>}>
        <EventCreationWizard />
      </Suspense>
    </div>
  );
}
