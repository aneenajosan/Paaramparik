'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getPendingEvents, approveEvent, rejectEvent } from '@/lib/api-client';

export default function EventModerationPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real environment, provide admin token from session or use standard auth
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || undefined : undefined;
      const res = await getPendingEvents(token);
      setEvents(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (eventId: string) => {
    setActionBusyId(eventId);
    try {
      const notes = notesMap[eventId] || 'Approved by administrator.';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || undefined : undefined;
      await approveEvent(eventId, notes, token);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleReject = async (eventId: string) => {
    const notes = notesMap[eventId];
    if (!notes || notes.trim().length < 5) {
      alert('Please enter a rejection reason (at least 5 characters) for the contributor.');
      return;
    }

    setActionBusyId(eventId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || undefined : undefined;
      await rejectEvent(eventId, notes, token);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-cream-muted">
        <Loader2 size={32} className="animate-spin text-saffron-500" />
        <p className="mt-3">Loading pending cultural event submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Event Moderation Queue</h2>
          <p className="text-xs text-cream-muted">
            {events.length} submission(s) awaiting verification and approval.
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn-ghost flex items-center gap-1.5 text-xs text-saffron-400"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/80 bg-rose-950/40 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="card p-12 text-center text-cream-muted">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
          <h3 className="mt-3 text-lg font-bold text-cream">Queue is Clean</h3>
          <p className="mt-1 text-xs">No pending cultural event submissions at this time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="card overflow-hidden border border-crimson-800 p-6 shadow-md transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-crimson-800/60 pb-4">
                <div>
                  <span className="rounded bg-saffron-950 px-2 py-0.5 text-xs font-bold text-saffron-400 uppercase tracking-wider">
                    {ev.eventType} • {ev.artForm}
                  </span>
                  <h3 className="mt-1.5 text-2xl font-bold">{ev.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-cream-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-saffron-500" />
                      {ev.locality} {ev.neighborhood ? `(${ev.neighborhood})` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-saffron-500" />
                      {new Date(ev.eventDate).toLocaleDateString()} ({ev.startTime} - {ev.endTime})
                    </span>
                    <span>Cost: {ev.costType}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full bg-amber-900/60 px-3 py-0.5 text-xs font-semibold text-amber-300">
                    Pending Review
                  </span>
                  <span className="text-xs text-cream-muted">
                    Submitted: {new Date(ev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Details & Cultural Context */}
              <div className="mt-4 grid gap-4 lg:grid-cols-2 text-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-400">
                    Description
                  </h4>
                  <p className="mt-1 leading-relaxed text-cream/90">{ev.description}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-400">
                    Cultural Background
                  </h4>
                  <p className="mt-1 leading-relaxed text-cream/90">
                    {ev.culturalBackground || 'None provided'}
                  </p>
                </div>
              </div>

              {/* Verified Contact Methods */}
              <div className="mt-4 rounded-lg bg-crimson-900/40 p-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Organizer Contact & Verification
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-semibold text-cream">Organizer: {ev.organizerName}</span>
                  {ev.organizerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className={ev.phoneVerified ? 'text-emerald-400' : 'text-cream-muted'} />
                      {ev.organizerPhone}
                      {ev.phoneVerified ? (
                        <span className="text-emerald-400 font-bold ml-0.5">✓ (SMS Verified)</span>
                      ) : (
                        <span className="text-amber-400">(Unverified)</span>
                      )}
                    </span>
                  )}
                  {ev.organizerEmail && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className={ev.emailVerified ? 'text-emerald-400' : 'text-cream-muted'} />
                      {ev.organizerEmail}
                      {ev.emailVerified ? (
                        <span className="text-emerald-400 font-bold ml-0.5">✓ (Email Verified)</span>
                      ) : (
                        <span className="text-amber-400">(Unverified)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* External Supporting Resources */}
              {ev.resources && ev.resources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-saffron-400">
                    Supporting Links ({ev.resources.length})
                  </h4>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ev.resources.map((r: any) => (
                      <a
                        key={r.id}
                        href={r.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-crimson-800 bg-crimson-950/60 p-2.5 text-xs hover:border-saffron-500/60"
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-saffron-400">{r.resourceTitle}</p>
                          <p className="text-cream-muted truncate">{r.resourceUrl}</p>
                        </div>
                        <ExternalLink size={14} className="shrink-0 text-cream-muted" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Actions Bar */}
              <div className="mt-6 border-t border-crimson-800/60 pt-4">
                <label className="text-xs text-cream-muted">
                  Administrative Review Notes / Feedback to Submitter:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified with festival trust committee via telephone. Approved."
                  value={notesMap[ev.id] || ''}
                  onChange={(e) => setNotesMap({ ...notesMap, [ev.id]: e.target.value })}
                  className="input mt-1 text-xs"
                />

                <div className="mt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={actionBusyId === ev.id}
                    onClick={() => handleReject(ev.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50"
                  >
                    <XCircle size={15} /> Reject Submission
                  </button>
                  <button
                    type="button"
                    disabled={actionBusyId === ev.id}
                    onClick={() => handleApprove(ev.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md"
                  >
                    {actionBusyId === ev.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    Approve & Publish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

