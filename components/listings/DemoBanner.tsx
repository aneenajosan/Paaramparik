import { FlaskConical } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="border-b border-saffron-300/80 bg-saffron-50 text-saffron-950">
      <p className="container-page flex items-start gap-2 py-2 text-xs text-saffron-900">
        <FlaskConical size={14} className="mt-0.5 shrink-0 text-saffron-600" aria-hidden />
        You are viewing bundled demonstration records. They draw on general public references and have{' '}
        <strong className="text-saffron-950 font-semibold">not been independently verified</strong>. Connect Supabase to show reviewed, locality-specific listings.
      </p>
    </div>
  );
}
