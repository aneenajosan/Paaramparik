'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flag, CheckCircle2, AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || undefined : undefined;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = filterStatus ? `/api/admin/reports?status=${filterStatus}` : '/api/admin/reports';
      const res = await fetch(url, { headers });
      const data = await res.json();
      setReports(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    const notes = prompt('Enter investigation notes / resolution summary:');
    if (notes === null) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || undefined : undefined;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      loadReports();
    } catch (err) {
      alert('Failed to update report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-rose-400 font-bold uppercase tracking-wider text-xs">Trust & Safety</p>
          <h1 className="text-3xl font-bold font-display mt-1">Misinformation Reports</h1>
          <p className="text-sm text-cream-muted mt-1">
            Community-submitted reports regarding inaccurate dates, incorrect locations, or fraudulent events.
          </p>
        </div>
        <button onClick={loadReports} className="btn-ghost flex items-center gap-1.5 text-xs text-saffron-400">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {['', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`rounded-full px-3.5 py-1 font-semibold transition-colors ${
              filterStatus === st
                ? 'bg-saffron-500 text-crimson-950'
                : 'border border-crimson-800 bg-crimson-950/60 text-cream-muted hover:text-cream'
            }`}
          >
            {st || 'All Reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-cream-muted">
          <Loader2 size={32} className="animate-spin mx-auto text-saffron-500" />
          <p className="mt-3">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-cream-muted">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
          <h3 className="mt-3 text-lg font-bold text-cream">No Reports Found</h3>
          <p className="mt-1 text-xs">No misinformation reports in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="card p-5 border border-crimson-800">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-crimson-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-950 px-2 py-0.5 text-xs font-bold text-rose-300">
                    {rep.reportCategory.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-cream-muted">
                    Reported on: {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    rep.status === 'PENDING'
                      ? 'bg-rose-900/60 text-rose-300'
                      : rep.status === 'UNDER_REVIEW'
                      ? 'bg-amber-900/60 text-amber-300'
                      : 'bg-emerald-900/60 text-emerald-300'
                  }`}
                >
                  {rep.status}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold text-cream">
                  Target Event:{' '}
                  <Link href={`/listings/${rep.event?.id}`} className="text-saffron-400 hover:underline">
                    {rep.event?.title || rep.eventId}
                  </Link>{' '}
                  <span className="text-xs text-cream-muted">({rep.event?.locality})</span>
                </p>
                <p className="mt-2 text-sm text-cream/90">{rep.reportDescription}</p>
                {rep.evidenceUrl && (
                  <a
                    href={rep.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-saffron-400 hover:underline"
                  >
                    Evidence Link <ExternalLink size={12} />
                  </a>
                )}
                {rep.reporterContact && (
                  <p className="mt-1 text-xs text-cream-muted">Reporter Contact: {rep.reporterContact}</p>
                )}
              </div>

              {rep.adminNotes && (
                <div className="mt-3 rounded bg-crimson-900/40 p-2 text-xs text-cream-muted">
                  <strong>Moderator Notes:</strong> {rep.adminNotes}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-crimson-800/40 pt-3">
                <button
                  onClick={() => handleUpdateStatus(rep.id, 'UNDER_REVIEW')}
                  className="rounded border border-amber-500/60 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/40"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => handleUpdateStatus(rep.id, 'RESOLVED')}
                  className="rounded border border-emerald-500/60 bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleUpdateStatus(rep.id, 'DISMISSED')}
                  className="rounded border border-crimson-800 px-3 py-1 text-xs font-semibold text-cream-muted hover:text-cream"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

