/**
 * Frontend API client communicating with the backend REST endpoints
 */

const API_BASE = '/api';

export async function sendContactOtp(contactType: 'PHONE' | 'EMAIL', contactValue: string, submissionRef?: string) {
  const res = await fetch(`${API_BASE}/contact/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactType, contactValue, submissionRef }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
}

export async function verifyContactOtp(
  contactType: 'PHONE' | 'EMAIL',
  contactValue: string,
  otp: string,
  submissionRef?: string
) {
  const res = await fetch(`${API_BASE}/contact/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactType, contactValue, otp, submissionRef }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to verify OTP');
  return data;
}

export async function checkDuplicateEvent(eventData: {
  title: string;
  description: string;
  culturalBackground?: string;
  artForm?: string;
  eventType?: string;
  eventDate: string;
  locality: string;
  organizerName?: string;
  excludeEventId?: string;
}) {
  const res = await fetch(`${API_BASE}/events/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Duplicate check failed');
  return data;
}

export async function submitCulturalEvent(eventData: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit event');
  return data;
}

export async function reportEventMisinformation(eventId: string, reportData: {
  reportCategory: string;
  reportDescription: string;
  evidenceUrl?: string;
  reporterContact?: string;
}) {
  const res = await fetch(`${API_BASE}/events/${eventId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit report');
  return data;
}

export async function getPendingEvents(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/events/pending`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch pending events');
  return data;
}

export async function approveEvent(eventId: string, notes?: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/events/${eventId}/approve`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve event');
  return data;
}

export async function rejectEvent(eventId: string, notes: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin/events/${eventId}/reject`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject event');
  return data;
}

