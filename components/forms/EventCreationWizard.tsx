'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import LocationPicker from '@/components/map/LocationPicker';
import { geocodePlace } from '@/lib/geocoding';
import {
  saveCreatedEvent,
  deleteStoredEvent,
  buildListingFromSubmission,
} from '@/lib/created-events';
import type { Listing } from '@/types';
import {
  sendContactOtp,
  verifyContactOtp,
  checkDuplicateEvent,
  submitCulturalEvent,
} from '@/lib/api-client';

interface ResourceItem {
  resourceTitle: string;
  resourceType: 'WEBSITE' | 'INSTAGRAM' | 'FACEBOOK' | 'REGISTRATION' | 'YOUTUBE' | 'GOVERNMENT' | 'OTHER';
  resourceUrl: string;
  description?: string;
}

const CATEGORIES = [
  'Festival',
  'Workshop',
  'Traditional Performance',
  'Exhibition',
  'Cultural Gathering',
  'Heritage Event',
  'Other',
];

const ART_FORMS = [
  'Music',
  'Dance',
  'Theatre',
  'Visual Arts',
  'Crafts',
  'Literature',
  'Traditional Ritual Arts',
  'Other',
];

const COST_MODELS = ['Free', 'Paid', 'Unknown'];

export default function EventCreationWizard() {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Festival');
  const [artForm, setArtForm] = useState('Music');
  const [description, setDescription] = useState('');
  const [culturalBackground, setCulturalBackground] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [eventEnd, setEventEnd] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [locality, setLocality] = useState('Kunnamkulam');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 10.6508, lng: 76.0694 });
  const [geocodingBusy, setGeocodingBusy] = useState(false);
  const [geocodedPlaceName, setGeocodedPlaceName] = useState<string | null>('Kunnamkulam, Thrissur, Kerala');
  const [costType, setCostType] = useState('Free');
  const [accessibility, setAccessibility] = useState('');

  // Contact Info & OTP (Email verification required)
  const [organizerName, setOrganizerName] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<string | null>(null);

  // Email OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // External Resources
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      resourceTitle: 'Official Program / Announcement',
      resourceType: 'WEBSITE',
      resourceUrl: '',
      description: 'Official schedule or registration page',
    },
  ]);

  // RAG Duplicate Detection State
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<any>(null);

  // Terms Acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);
  const [createdListing, setCreatedListing] = useState<Listing | null>(null);
  const [deletedNotice, setDeletedNotice] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpCooldown]);

  // Automatic Place Geocoding: when user types a place, automatically move map
  useEffect(() => {
    const query = address.trim() || locality.trim();
    if (!query || query.length < 2) return;

    const timer = setTimeout(async () => {
      setGeocodingBusy(true);
      try {
        const result = await geocodePlace(query);
        if (result) {
          setCoords({ lat: result.lat, lng: result.lng });
          setGeocodedPlaceName(result.displayName);
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      } finally {
        setGeocodingBusy(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locality, address]);

  // Handle direct preset place select
  const handleSelectPlacePreset = async (placeName: string) => {
    setLocality(placeName);
    setGeocodingBusy(true);
    try {
      const result = await geocodePlace(placeName);
      if (result) {
        setCoords({ lat: result.lat, lng: result.lng });
        setGeocodedPlaceName(result.displayName);
      }
    } finally {
      setGeocodingBusy(false);
    }
  };

  // Handle Email Changes (Invalidate verification if email changes)
  const handleEmailChange = (val: string) => {
    if (emailVerified && val !== organizerEmail) {
      setEmailVerified(false);
      setEmailVerifiedAt(null);
      setOtpSent(false);
      setOtpInput('');
    }
    setOrganizerEmail(val);
  };

  // Send Email OTP from sample mail
  const handleSendEmailOtp = async () => {
    if (!organizerEmail.trim() || !organizerEmail.includes('@')) {
      setOtpError('Please enter a valid organizer email address.');
      return;
    }

    setOtpBusy(true);
    setOtpError(null);
    setOtpSuccessMsg(null);
    try {
      const res = await sendContactOtp('EMAIL', organizerEmail);
      setOtpSent(true);
      setOtpCooldown(res.data?.cooldownSeconds || 60);
      setSenderEmail(res.data?.senderEmail || 'verify@paaramparik.culture');
      setPreviewUrl(res.data?.previewUrl || null);

      let msg = `Verification email sent from ${res.data?.senderEmail || 'verify@paaramparik.culture'} to ${organizerEmail}`;
      if (res.data?.debugOtp) {
        msg += ` (OTP Code: ${res.data.debugOtp})`;
      }
      setOtpSuccessMsg(msg);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send verification email. Please check the address.');
    } finally {
      setOtpBusy(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code received in your email.');
      return;
    }

    setOtpBusy(true);
    setOtpError(null);
    try {
      const res = await verifyContactOtp('EMAIL', organizerEmail, otpInput.trim());
      setEmailVerified(true);
      setEmailVerifiedAt(res.data?.verifiedAt || new Date().toISOString());
      setOtpSent(false);
      setOtpInput('');
      setOtpSuccessMsg('Email address verified successfully!');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpBusy(false);
    }
  };

  // Add / Remove Resources
  const addResource = () => {
    setResources((prev) => [
      ...prev,
      { resourceTitle: '', resourceType: 'WEBSITE', resourceUrl: '', description: '' },
    ]);
  };

  const removeResource = (index: number) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  const updateResource = (index: number, key: keyof ResourceItem, value: string) => {
    setResources((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  // Run Duplicate Check
  const runDuplicateCheck = async () => {
    setCheckingDuplicate(true);
    try {
      const res = await checkDuplicateEvent({
        title,
        description,
        culturalBackground,
        artForm,
        eventType: category,
        eventDate,
        locality,
        organizerName,
      });
      setDuplicateResult(res);
      return res;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Step Navigations
  const nextStep = async () => {
    if (step === 1) {
      if (!title || !description || !eventDate || !locality || !address) {
        alert('Please fill in all required event details (Name, Description, Date, Locality, and Address).');
        return;
      }
    }
    if (step === 2) {
      if (!organizerName.trim()) {
        alert('Please enter the organizer or troupe name.');
        return;
      }
      if (!organizerEmail.trim()) {
        alert('Please enter the organizer email address.');
        return;
      }
      if (!emailVerified) {
        alert('Email verification required: Please verify your email address via the OTP code before proceeding.');
        return;
      }
    }
    if (step === 3) {
      const validResources = resources.filter((r) => r.resourceTitle.trim() && r.resourceUrl.trim());
      if (validResources.length === 0) {
        alert('At least one external supporting resource link is required.');
        return;
      }
      // Run duplicate check automatically before moving to Step 4
      await runDuplicateCheck();
    }
    if (step === 4) {
      if (duplicateResult?.isDuplicate) {
        alert('This event cannot be submitted because an exact duplicate already exists.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  // Submit Event
  const handleSubmit = async () => {
    if (!termsAccepted) {
      alert('You must accept the terms and conditions before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);
    try {
      const validResources = resources.filter((r) => r.resourceTitle.trim() && r.resourceUrl.trim());
      const payload = {
        title,
        description,
        culturalBackground,
        artForm,
        eventType: category,
        locality,
        neighborhood: neighborhood || undefined,
        address,
        latitude: coords.lat,
        longitude: coords.lng,
        eventDate,
        eventEnd: isMultiDay && eventEnd ? eventEnd : undefined,
        startTime,
        endTime,
        costType,
        organizerName,
        organizerPhone: organizerPhone || undefined,
        organizerEmail: organizerEmail || undefined,
        phoneVerified: false,
        emailVerified,
        accessibility: accessibility || undefined,
        resources: validResources,
        termsAccepted: true,
        termsVersion: '1.0',
      };

      const result = await submitCulturalEvent(payload);
      const eventId = result.data?.eventId || `ev_created_${Date.now()}`;
      const newListing = buildListingFromSubmission(eventId, payload);
      saveCreatedEvent(newListing);
      setCreatedListing(newListing);
      setSubmissionSuccess(result);
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission failed. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCurrentEvent = async () => {
    if (!createdListing) return;
    if (!confirm(`Are you sure you want to delete "${createdListing.title}"? This cannot be undone.`)) {
      return;
    }
    await deleteStoredEvent(createdListing.id);
    setDeletedNotice(`Event "${createdListing.title}" was deleted successfully.`);
    setCreatedListing(null);
    setSubmissionSuccess(null);
    setStep(1);
  };

  if (submissionSuccess && createdListing) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center sm:p-12 animate-in fade-in duration-300">
        <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
        <h2 className="mt-4 text-3xl font-bold">Event Created & Live on Front Page!</h2>
        <p className="mt-2 text-sm text-cream-muted">
          Your cultural event has been published and is now directly visible on the front page interactive map and event directory.
        </p>

        {/* Event Preview Card */}
        <div className="mt-6 rounded-xl border border-saffron-500/40 bg-crimson-950/80 p-5 text-left shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-crimson-800/80 pb-3">
            <span className="font-display text-lg font-bold text-cream">{createdListing.title}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live on Front Page
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-cream-muted">
            <div>
              <span className="text-saffron-400 font-semibold block">📅 Date & Time:</span>
              <span className="text-cream">{createdListing.event_start} ({createdListing.event_start_time || '18:00'} - {createdListing.event_end_time || '21:00'})</span>
            </div>
            <div>
              <span className="text-saffron-400 font-semibold block">📍 Location:</span>
              <span className="text-cream">{createdListing.location_name}</span>
            </div>
            <div>
              <span className="text-saffron-400 font-semibold block">👤 Organizer:</span>
              <span className="text-cream">{createdListing.practitioner_name}</span>
            </div>
            <div>
              <span className="text-saffron-400 font-semibold block">✉️ Verified Contact:</span>
              <span className="text-emerald-400 font-semibold">{createdListing.contact_information.email} ✓</span>
            </div>
          </div>

          {/* Delete Option Right on Success Card */}
          <div className="mt-4 pt-3 border-t border-crimson-800/60 flex items-center justify-between">
            <span className="text-[11px] text-cream-muted">Changed your mind or made a typo?</span>
            <button
              type="button"
              onClick={handleDeleteCurrentEvent}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-rose-800 bg-rose-950/60 text-xs text-rose-300 hover:bg-rose-900 hover:text-white transition-colors"
            >
              <Trash2 size={13} /> Delete Event
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-saffron flex items-center gap-2 font-bold px-6 py-2.5 shadow-lg">
            View on Front Page Map & Listings <ArrowRight size={16} />
          </Link>
          <Link href="/directory" className="btn-ghost">
            Explore Directory
          </Link>
          <button
            onClick={() => {
              setSubmissionSuccess(null);
              setCreatedListing(null);
              setTitle('');
              setDescription('');
              setCulturalBackground('');
              setStep(1);
            }}
            className="btn-ghost"
          >
            Submit Another Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Wizard Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-cream-muted">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Email Verification' },
            { num: 3, label: 'Resources' },
            { num: 4, label: 'Duplicate Check' },
            { num: 5, label: 'Terms & Submit' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold transition-colors ${
                  step === s.num
                    ? 'bg-saffron-500 text-crimson-950 ring-4 ring-saffron-500/20'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'border border-crimson-800 bg-crimson-900/40 text-cream-muted'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`mt-2 hidden text-center sm:block ${step === s.num ? 'text-saffron-400 font-bold' : ''}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-crimson-900">
          <div
            className="h-full bg-saffron-500 transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {/* STEP 1: EVENT INFORMATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">1. Event Information</h2>
              <p className="mt-1 text-sm text-cream-muted">
                Provide accurate, detailed information about the cultural gathering or performance.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="title">Event Name *</label>
              <input
                id="title"
                type="text"
                className="input"
                placeholder="e.g. Traditional Music Festival"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category">Event Category *</label>
                <select
                  id="category"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="artForm">Art Form *</label>
                <select
                  id="artForm"
                  className="input"
                  value={artForm}
                  onChange={(e) => setArtForm(e.target.value)}
                >
                  {ART_FORMS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="description">Short Description *</label>
              <textarea
                id="description"
                rows={3}
                className="input"
                placeholder="Describe what visitors can experience at this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="culturalBackground">Cultural & Historical Background *</label>
              <textarea
                id="culturalBackground"
                rows={3}
                className="input"
                placeholder="Explain the lineage, tradition, community roots, or rituals associated with this art form..."
                value={culturalBackground}
                onChange={(e) => setCulturalBackground(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-crimson-800/60 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="eventDate">Event Date *</label>
                  <input
                    id="eventDate"
                    type="date"
                    className="input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="multiDay"
                    checked={isMultiDay}
                    onChange={(e) => setIsMultiDay(e.target.checked)}
                    className="h-4 w-4 rounded border-crimson-800 text-saffron-500 focus:ring-saffron-500"
                  />
                  <label htmlFor="multiDay" className="text-sm cursor-pointer select-none">
                    Multi-day event
                  </label>
                </div>
              </div>

              {isMultiDay && (
                <div className="mt-4">
                  <label className="label" htmlFor="eventEnd">Event End Date *</label>
                  <input
                    id="eventEnd"
                    type="date"
                    className="input"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="startTime">Start Time *</label>
                  <input
                    id="startTime"
                    type="time"
                    className="input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="endTime">End Time *</label>
                  <input
                    id="endTime"
                    type="time"
                    className="input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-crimson-800/60 pt-4">
              <div className="mb-3">
                <span className="text-xs text-cream-muted font-semibold">Quick Cultural Hubs:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    'Kunnamkulam',
                    'Thrissur',
                    'Guruvayur',
                    'Cheruthuruthy',
                    'Irinjalakuda',
                    'Kochi',
                    'Palakkad',
                    'Kozhikode',
                    'Trivandrum',
                  ].map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => handleSelectPlacePreset(place)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        locality.toLowerCase() === place.toLowerCase()
                          ? 'bg-saffron-500 font-bold text-crimson-950'
                          : 'border border-crimson-800 bg-crimson-900/50 text-cream-muted hover:border-saffron-500/50 hover:text-cream'
                      }`}
                    >
                      {place}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label flex items-center justify-between" htmlFor="locality">
                    <span>Locality / Town *</span>
                    <span className="text-[11px] font-normal text-saffron-400">Auto-moves map pin</span>
                  </label>
                  <div className="relative">
                    <input
                      id="locality"
                      type="text"
                      className="input pr-8"
                      placeholder="e.g. Kunnamkulam, Thrissur, Kochi..."
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      required
                    />
                    <MapPin size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-saffron-400/80 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="neighborhood">Neighborhood / Landmark</label>
                  <input
                    id="neighborhood"
                    type="text"
                    className="input"
                    placeholder="e.g. Near Bhavana Nagar / Vadakkumnathan Temple"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label" htmlFor="address">Full Address *</label>
                <input
                  id="address"
                  type="text"
                  className="input"
                  placeholder="Street name, venue compound, town, PIN"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Auto-geocoding live notification */}
              <div className="mt-2 min-h-[22px]">
                {geocodingBusy ? (
                  <div className="flex items-center gap-1.5 text-xs text-saffron-400 animate-pulse">
                    <Loader2 size={13} className="animate-spin shrink-0" />
                    <span>Locating place and updating map pin...</span>
                  </div>
                ) : geocodedPlaceName ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>
                      Map automatically centered on: <strong className="text-cream">{geocodedPlaceName}</strong>
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                  <label className="label mb-0">Venue Map Pin (Auto-Synced with Typed Place)</label>
                  <span className="text-[11px] text-cream-muted">
                    Drag pin or click map to refine exact venue position
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-crimson-800 shadow-md">
                  <LocationPicker
                    lat={coords.lat}
                    lng={coords.lng}
                    onPick={(lat: number, lng: number) => setCoords({ lat, lng })}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-mono text-cream-muted">
                  <span>Latitude: {coords.lat.toFixed(5)}</span>
                  <span>Longitude: {coords.lng.toFixed(5)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-crimson-800/60 pt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="cost">Admission / Cost Model *</label>
                <select
                  id="cost"
                  className="input"
                  value={costType}
                  onChange={(e) => setCostType(e.target.value)}
                >
                  {COST_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="accessibility">Accessibility & Facilities</label>
                <input
                  id="accessibility"
                  type="text"
                  className="input"
                  placeholder="e.g. Wheelchair ramp, parking available"
                  value={accessibility}
                  onChange={(e) => setAccessibility(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ORGANIZER INFO & EMAIL VERIFICATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">2. Organizer & Email Verification</h2>
              <p className="mt-1 text-sm text-cream-muted">
                To prevent fraud and maintain accountability, you must verify your organizer email address via a 6-digit verification code. Email is dispatched from our sample mail service.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="organizerName">Organizer / Troupe / Institution Name *</label>
              <input
                id="organizerName"
                type="text"
                className="input"
                placeholder="e.g. Kunnamkulam Heritage Society / Kalamandalam Troupe"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                required
              />
            </div>

            {/* Optional Phone Number (No OTP required) */}
            <div>
              <label className="label flex items-center justify-between" htmlFor="organizerPhone">
                <span>Contact Phone Number (Optional)</span>
                <span className="text-[11px] font-normal text-cream-muted">No OTP required</span>
              </label>
              <div className="relative">
                <input
                  id="organizerPhone"
                  type="tel"
                  className="input pl-10"
                  placeholder="+91 9876543210 (Optional contact for visitors)"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                />
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted pointer-events-none" />
              </div>
              <p className="mt-1 text-[11px] text-cream-muted">
                Optional public telephone number for attendees inquiring about venue directions or passes.
              </p>
            </div>

            {/* Email Address Verification Box (Mandatory OTP) */}
            <div className={`rounded-xl border p-5 transition-colors ${emailVerified ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-crimson-800/80 bg-crimson-950/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail size={18} className={emailVerified ? 'text-emerald-400' : 'text-saffron-500'} />
                  <span className="font-semibold">Organizer Email Address (Verification Required) *</span>
                </div>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/60 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 size={13} /> Verified Email
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                    <ShieldCheck size={14} /> Verification Required
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-cream-muted">
                A verification email with your 6-digit code will be dispatched from our sample mail sender ({senderEmail || 'verify@paaramparik.culture'}).
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  className="input flex-1"
                  placeholder="organizer@culturaltrust.org"
                  value={organizerEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={emailVerified}
                  required
                />
                {!emailVerified ? (
                  <button
                    type="button"
                    disabled={otpBusy || otpCooldown > 0 || !organizerEmail.trim() || !organizerEmail.includes('@')}
                    onClick={handleSendEmailOtp}
                    className="btn-saffron whitespace-nowrap px-4 py-2 text-sm font-semibold"
                  >
                    {otpBusy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : otpCooldown > 0 ? (
                      `Resend (${otpCooldown}s)`
                    ) : otpSent ? (
                      'Resend Code'
                    ) : (
                      'Send Verification Email'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailVerified(false);
                      setEmailVerifiedAt(null);
                      setOtpSent(false);
                    }}
                    className="btn-ghost text-xs text-cream-muted hover:text-rose-400"
                  >
                    Change
                  </button>
                )}
              </div>

              {emailVerifiedAt && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>
                    Verified organizer email &bull; {new Date(emailVerifiedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Email OTP Entry Dialog Area */}
            {otpSent && !emailVerified && (
              <div className="rounded-xl border border-saffron-500/60 bg-crimson-900/90 p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-bold text-saffron-400 text-sm">
                    <ShieldCheck size={18} />
                    Enter 6-Digit Email Verification Code
                  </h3>
                  <span className="text-xs font-mono text-saffron-300/80">Expires in 5m</span>
                </div>

                <p className="mt-1 text-xs text-cream-muted leading-relaxed">
                  We sent a 6-digit confirmation code from sample mail{' '}
                  <strong className="text-saffron-300">{senderEmail || 'verify@paaramparik.culture'}</strong> to{' '}
                  <strong className="text-cream">{organizerEmail}</strong>.
                </p>

                {previewUrl && (
                  <div className="mt-2.5 rounded-lg border border-saffron-500/30 bg-saffron-950/60 p-2.5 text-xs">
                    <span className="text-saffron-300">📬 Sample Mail Preview: </span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-saffron-400 underline hover:text-saffron-200 inline-flex items-center gap-1"
                    >
                      Open Ethereal Mail Inbox <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {otpSuccessMsg && (
                  <p className="mt-2 rounded bg-saffron-950/50 p-2 text-xs text-saffron-300 border border-saffron-500/20">
                    {otpSuccessMsg}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    className="input w-48 text-center font-mono text-xl tracking-widest font-bold"
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={otpBusy || otpInput.trim().length !== 6}
                    onClick={handleVerifyEmailOtp}
                    className="btn-saffron px-5 py-2 font-bold text-sm shadow-md"
                  >
                    {otpBusy ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpInput('');
                      setOtpError(null);
                    }}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {otpError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-crimson-900/40 p-4 text-xs text-cream-muted flex gap-2.5">
              <HelpCircle size={16} className="mt-0.5 shrink-0 text-saffron-500" />
              <span>
                <strong>Why verify?</strong> Email verification links your cultural submission to an authentic organizer or troupe identity. Submissions remain unpublished until reviewed by platform administrators.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: EXTERNAL RESOURCES */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">3. Know More / Official Event Resources</h2>
                <p className="mt-1 text-sm text-cream-muted">
                  Provide at least one verifiable external link (Official website, Instagram profile, registration page, or institution announcement).
                </p>
              </div>
              <button
                type="button"
                onClick={addResource}
                className="btn-ghost flex items-center gap-1 text-xs text-saffron-400"
              >
                <Plus size={14} /> Add Resource
              </button>
            </div>

            <div className="space-y-4">
              {resources.map((item, index) => (
                <div key={index} className="rounded-xl border border-crimson-800 bg-crimson-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-saffron-400">
                      Resource #{index + 1}
                    </span>
                    {resources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="text-cream-muted hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-cream-muted">Resource Title *</label>
                      <input
                        type="text"
                        className="input mt-1"
                        placeholder="e.g. Official Festival Website"
                        value={item.resourceTitle}
                        onChange={(e) => updateResource(index, 'resourceTitle', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-cream-muted">Resource Type *</label>
                      <select
                        className="input mt-1"
                        value={item.resourceType}
                        onChange={(e) => updateResource(index, 'resourceType', e.target.value as any)}
                      >
                        <option value="WEBSITE">Official Website</option>
                        <option value="INSTAGRAM">Instagram Post / Page</option>
                        <option value="FACEBOOK">Facebook Event</option>
                        <option value="REGISTRATION">Registration / Ticket Link</option>
                        <option value="YOUTUBE">YouTube Video</option>
                        <option value="GOVERNMENT">Government / Institutional Portal</option>
                        <option value="OTHER">Other Reference</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-cream-muted">Resource URL (HTTPS) *</label>
                    <input
                      type="url"
                      className="input mt-1"
                      placeholder="https://festival.kerala.gov.in"
                      value={item.resourceUrl}
                      onChange={(e) => updateResource(index, 'resourceUrl', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mt-3">
                    <label className="text-xs text-cream-muted">Description (Optional)</label>
                    <input
                      type="text"
                      className="input mt-1"
                      placeholder="e.g. Detailed timetable and artist lineup"
                      value={item.description || ''}
                      onChange={(e) => updateResource(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: DUPLICATE DETECTION RESULTS */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">4. Intelligent Duplicate Detection</h2>
              <p className="mt-1 text-sm text-cream-muted">
                Our RAG semantic retrieval engine scanned existing cultural records across dates, locations, and titles to prevent duplicate submissions.
              </p>
            </div>

            {checkingDuplicate ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Loader2 size={36} className="animate-spin text-saffron-500" />
                <p className="mt-4 font-semibold text-cream">Searching cultural event embeddings...</p>
                <p className="mt-1 text-xs text-cream-muted">Comparing semantic embeddings and structured metadata</p>
              </div>
            ) : duplicateResult?.isDuplicate ? (
              /* Case A: Exact Duplicate Blocked */
              <div className="rounded-xl border border-rose-500/60 bg-rose-950/40 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={28} className="mt-0.5 shrink-0 text-rose-400" />
                  <div>
                    <h3 className="text-lg font-bold text-rose-300">
                      An event with these details already exists
                    </h3>
                    <p className="mt-1 text-sm text-cream-muted">
                      {duplicateResult.message}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {duplicateResult.matches?.map((m: any) => (
                    <div key={m.id} className="rounded-lg border border-rose-800/60 bg-crimson-950/80 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cream">{m.title}</span>
                        <span className="rounded bg-rose-900/60 px-2 py-0.5 text-xs font-semibold text-rose-300">
                          {Math.round(m.similarity * 100)}% match
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-cream-muted">
                        <span>📅 Date: {m.eventDate}</span>
                        <span>📍 Locality: {m.locality}</span>
                        <span>👤 Organizer: {m.organizerName || 'Not specified'}</span>
                      </div>
                      {m.matchReason && <p className="mt-2 text-xs text-rose-300/80">{m.matchReason}</p>}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-rose-300">
                  Duplicate submissions are blocked to maintain catalogue integrity. If you believe this is an error or you represent a different organizer, please review the existing listing or contact our moderation team.
                </p>
              </div>
            ) : duplicateResult?.requiresReview ? (
              /* Case B: Highly Similar / Separate Edition Warning */
              <div className="rounded-xl border border-amber-500/60 bg-amber-950/30 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={28} className="mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-300">
                      Similar Event Detected — Please Review
                    </h3>
                    <p className="mt-1 text-sm text-cream-muted">
                      {duplicateResult.message}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {duplicateResult.matches?.map((m: any) => (
                    <div key={m.id} className="rounded-lg border border-amber-800/60 bg-crimson-950/80 p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cream">{m.title}</span>
                        <span className="rounded bg-amber-900/60 px-2 py-0.5 text-xs font-semibold text-amber-300">
                          {Math.round(m.similarity * 100)}% similarity
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-cream-muted">
                        <span>📅 Existing Date: {m.eventDate}</span>
                        <span>📍 Locality: {m.locality}</span>
                        <span>👤 Organizer: {m.organizerName || 'Unspecified'}</span>
                      </div>
                      {m.matchReason && <p className="mt-2 text-xs text-amber-200/90">{m.matchReason}</p>}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-cream-muted">
                  If your submission is a distinct edition (e.g. next year&apos;s annual festival edition or a separate workshop), you may proceed to terms and submit.
                </p>
              </div>
            ) : (
              /* Case C: Clean, No Duplicates Found */
              <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/20 p-6 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
                <h3 className="mt-3 text-lg font-bold text-emerald-300">
                  No Duplicate Events Found
                </h3>
                <p className="mt-1 text-sm text-cream-muted">
                  Your event details and dates are unique in our database. You are ready to proceed with submission.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: TERMS & CONDITIONS & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">5. Terms and Conditions & Final Submission</h2>
              <p className="mt-1 text-sm text-cream-muted">
                Please review the platform agreement and confirm your submission.
              </p>
            </div>

            {/* 10-Point Legal Terms Box */}
            <div className="rounded-xl border border-crimson-800 bg-crimson-950/60 p-5 text-xs leading-relaxed text-cream/90 max-h-64 overflow-y-auto space-y-3">
              <h4 className="font-bold text-sm text-saffron-400 uppercase tracking-wide">
                Event Information Accuracy and Legal Responsibility (Version 1.0)
              </h4>
              <p>By submitting this event, I confirm that:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>The information provided is accurate and complete to the best of my knowledge.</li>
                <li>The event is genuine, or I am authorized to submit information about it.</li>
                <li>I have the necessary permission to use the submitted photographs, descriptions and other materials.</li>
                <li>The contact information provided belongs to me or an authorized event representative.</li>
                <li>The supporting links lead to relevant event, organizer or official information.</li>
                <li>I will update the platform if the event is cancelled, postponed or its details change.</li>
                <li>I understand that deliberately submitting fabricated events, misleading information, impersonating organizers or repeatedly providing false information may result in rejection, removal, suspension of my account and other appropriate action.</li>
                <li>I understand that knowingly providing false information may expose me to legal consequences under applicable laws.</li>
                <li>I acknowledge that the platform may review, verify, modify for clarity, reject or remove submitted listings.</li>
                <li>I understand that contact verification does not guarantee event authenticity or platform endorsement.</li>
              </ol>
            </div>

            {/* Mandatory Checkbox */}
            <div className="rounded-lg border border-saffron-500/50 bg-saffron-950/30 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-crimson-800 text-saffron-500 focus:ring-saffron-500"
                  required
                />
                <span className="text-sm font-semibold text-cream leading-snug">
                  I have read and agree to the Terms and Conditions. I confirm that the event details and supporting information I have provided are accurate to the best of my knowledge. *
                </span>
              </label>
            </div>

            {/* Summary Review */}
            <div className="rounded-lg bg-crimson-900/40 p-4 text-xs space-y-2">
              <div className="font-semibold text-saffron-400 uppercase tracking-wider">Summary Review</div>
              <div className="grid grid-cols-2 gap-2 text-cream-muted">
                <div>Event Name: <span className="text-cream">{title}</span></div>
                <div>Locality: <span className="text-cream">{locality}</span></div>
                <div>Date: <span className="text-cream">{eventDate} ({startTime} - {endTime})</span></div>
                <div>Category: <span className="text-cream">{category} ({artForm})</span></div>
                <div>Verified Email: <span className="text-emerald-400 font-semibold">{organizerEmail} ✓</span></div>
                <div>Resources: <span className="text-cream">{resources.length} link(s) attached</span></div>
              </div>
            </div>

            {submissionError && (
              <div className="rounded-lg border border-rose-500/80 bg-rose-950/50 p-4 text-sm text-rose-300">
                {submissionError}
              </div>
            )}
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-crimson-800/60 pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
              className="btn-ghost flex items-center gap-1.5 text-sm"
              disabled={submitting}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-saffron flex items-center gap-1.5 text-sm font-bold"
              disabled={step === 4 && duplicateResult?.isDuplicate}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !termsAccepted}
              className="btn-saffron flex items-center gap-2 px-6 py-2.5 text-sm font-bold shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting for Review...
                </>
              ) : (
                'Submit Event for Moderation'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
