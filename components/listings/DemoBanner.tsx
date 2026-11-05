import { FlaskConical } from 'lucide-react';
export default function DemoBanner() {
  return (
    <div className="border-b border-saffron-500/50 bg-saffron-950">
      <p className="container-page flex items-start gap-2 py-2.5 text-xs text-cream-muted"><FlaskConical size={14} className="mt-0.5 shrink-0 text-saffron-500" aria-hidden />
        You are viewing bundled demonstration records. They draw on general public references and have <strong className="text-cream">not been independently verified</strong>. Connect Supabase to show reviewed, locality-specific listings.</p>
    </div>
  );
}
