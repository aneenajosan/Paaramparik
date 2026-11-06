import { BadgeCheck, FlaskConical, Clock, CircleHelp } from 'lucide-react';
import { TYPE_META, VERIFICATION_LABEL, SUBMISSION_LABEL } from '@/lib/listing-meta';
import type { ListingType, SubmissionStatus, VerificationStatus } from '@/types';
import { cn } from '@/lib/utils';

export function TypeBadge({ type }: { type: ListingType }) {
  const { Icon, label, color } = TYPE_META[type];
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"><span className="inline-block h-2.5 w-2.5" style={{ background: color }} aria-hidden /><Icon size={13} aria-hidden />{label}</span>;
}

const V_ICON = { verified: BadgeCheck, demo: FlaskConical, under_review: Clock, unverified: CircleHelp };
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const Icon = V_ICON[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold rounded',
      status === 'verified' ? 'border-saffron-600 text-saffron-700 bg-saffron-50' : 'border-stone-300 text-stone-600 bg-stone-50')}>
      <Icon size={12} aria-hidden />{VERIFICATION_LABEL[status]}
    </span>
  );
}

const S_STYLE: Record<SubmissionStatus, string> = {
  pending_review: 'bg-plum-800 text-cream', approved: 'bg-saffron-500 text-crimson-950',
  changes_requested: 'bg-saffron-900 text-cream border border-saffron-500', rejected: 'bg-crimson-600 text-cream',
};
export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <span className={cn('inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wide', S_STYLE[status])}>{SUBMISSION_LABEL[status]}</span>;
}
