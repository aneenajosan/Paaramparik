import Link from 'next/link';
import EventModerationPanel from '@/components/admin/EventModerationPanel';

export const metadata = { title: 'Submissions & Moderation — Admin' };
export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-saffron-500 font-bold uppercase tracking-wider text-xs">Administrative Moderation</p>
        <h1 className="text-3xl font-bold font-display mt-1">Cultural Event Submissions</h1>
        <p className="text-sm text-cream-muted mt-1">
          Review, verify contact credentials, inspect supporting evidence links, and approve cultural events for public discovery.
        </p>
      </div>

      <EventModerationPanel />
    </div>
  );
}
