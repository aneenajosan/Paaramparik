'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, MessageSquareWarning, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Decision = 'approved' | 'changes_requested' | 'rejected';
export default function ReviewPanel({ submissionId, initialComments = '' }: { submissionId: string; initialComments?: string }) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments), [busy, setBusy] = useState<Decision | null>(null), [err, setErr] = useState<string | null>(null);
  async function decide(d: Decision) {
    setErr(null);
    if (d !== 'approved' && !comments.trim()) return setErr('Comments are required when requesting changes or rejecting.');
    if (d === 'approved' && !confirm('Approve and publish this listing? It will become public on the map and directory.')) return;
    setBusy(d);
    const { error } = await createClient().rpc('review_submission', { p_submission_id: submissionId, p_decision: d, p_comments: comments.trim() || null });
    setBusy(null);
    if (error) return setErr(error.message);
    router.refresh();
  }
  return (
    <div className="card space-y-3 p-5"><h2 className="text-xl">Moderation decision</h2>
      <label htmlFor="cm" className="label">Comments for the contributor</label>
      <textarea id="cm" rows={4} className="input" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Required for “Request changes” and “Reject”." />
      {err && <p role="alert" className="error-text">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-saffron" disabled={!!busy} onClick={() => decide('approved')}><Check size={16} />{busy === 'approved' ? 'Publishing…' : 'Approve & publish'}</button>
        <button className="btn-ghost" disabled={!!busy} onClick={() => decide('changes_requested')}><MessageSquareWarning size={16} />Request changes</button>
        <button className="btn-primary" disabled={!!busy} onClick={() => decide('rejected')}><X size={16} />Reject</button></div>
      <p className="hint">Every decision is recorded in the moderation history.</p>
    </div>
  );
}
