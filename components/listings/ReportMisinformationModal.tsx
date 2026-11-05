'use client';

import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { reportEventMisinformation } from '@/lib/api-client';

interface ReportModalProps {
  eventId: string;
  eventTitle: string;
}

const REPORT_CATEGORIES = [
  { value: 'EVENT_DOES_NOT_EXIST', label: 'Event does not exist' },
  { value: 'INCORRECT_DATE_OR_TIME', label: 'Incorrect event date or time' },
  { value: 'INCORRECT_LOCATION', label: 'Incorrect venue or locality' },
  { value: 'FAKE_ORGANIZER_OR_CONTACT', label: 'Fake organizer or contact details' },
  { value: 'MISLEADING_CULTURAL_INFO', label: 'Misleading cultural background / details' },
  { value: 'INCORRECT_DESCRIPTION', label: 'Inaccurate event description' },
  { value: 'DUPLICATE_EVENT', label: 'Duplicate event listing' },
  { value: 'BROKEN_REGISTRATION_LINK', label: 'Broken or fraudulent registration link' },
  { value: 'OTHER', label: 'Other issue' },
];

export default function ReportMisinformationModal({ eventId, eventTitle }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(REPORT_CATEGORIES[0].value);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide at least 10 characters explaining the issue.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await reportEventMisinformation(eventId, {
        reportCategory: category,
        reportDescription: description,
        evidenceUrl: evidenceUrl.trim() || undefined,
        reporterContact: reporterContact.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      setEvidenceUrl('');
      setReporterContact('');
      setError(null);
    }, 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-crimson-800/80 bg-crimson-950/40 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:border-rose-500/60 hover:bg-rose-950/30 transition-colors"
      >
        <Flag size={14} className="text-rose-400" />
        Report Incorrect Information
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-crimson-800 bg-crimson-950 p-6 shadow-2xl">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-cream-muted hover:text-cream"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="p-6 text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
                <h3 className="mt-3 text-xl font-bold">Report Submitted</h3>
                <p className="mt-2 text-sm text-cream-muted">
                  Thank you for helping keep our cultural map authentic and accurate. Our community moderators have received your report and will investigate promptly.
                </p>
                <button onClick={handleClose} className="btn-saffron mt-6 w-full">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle size={20} />
                  <span>Report Event: {eventTitle}</span>
                </div>
                <p className="text-xs text-cream-muted">
                  Reports are investigated by administrators and will not automatically delete the listing.
                </p>

                {error && (
                  <div className="rounded-lg border border-rose-500/80 bg-rose-950/50 p-3 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-cream">Issue Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input mt-1 text-sm"
                  >
                    {REPORT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-cream">Explanation & Evidence *</label>
                  <textarea
                    rows={3}
                    className="input mt-1 text-sm"
                    placeholder="Describe what is incorrect (e.g., date postponed to next week, venue moved)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-cream">Supporting Link / Source URL (Optional)</label>
                  <input
                    type="url"
                    className="input mt-1 text-sm"
                    placeholder="https://official-announcement.org/notice"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-cream">Your Email / Phone (Optional)</label>
                  <input
                    type="text"
                    className="input mt-1 text-sm"
                    placeholder="In case our moderators need further clarification"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-ghost flex-1 py-2 text-sm"
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-saffron flex-1 py-2 text-sm font-bold flex items-center justify-center gap-1.5"
                    disabled={busy}
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

