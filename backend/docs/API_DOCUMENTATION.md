# The Living Culture Map — Complete Backend API Documentation
## Cultural Event Creation, Verification, RAG Trust Engine & Discovery

This document details the REST API specifications for The Living Culture Map, built with **Node.js, Express.js, TypeScript, PostgreSQL, Prisma ORM, and Zod**.

---

## 1. Overview & Service Architecture

The system provides:
1. **Multi-Criteria Cultural Filtering & Geo-Discovery** (artForm, eventType, cost, date, locality, radius).
2. **Contact Verification Engine** (Phone SMS OTP & Email OTP with 5-minute expiry, hashing, cooldowns, and attempt limits).
3. **RAG-based Duplicate Detection** (384-dimensional vector embeddings, cosine similarity, structured metadata comparison).
4. **External Resource Links Management** (Instagram, Facebook, official websites, registration pages, YouTube).
5. **Misinformation Reporting System** (Community reporting of incorrect dates, fake events, misleading info, with admin investigations).
6. **Submission Terms & Conditions** (10-point legal accuracy agreement stored with consent timestamps).
7. **Administrative Moderation** (Audit-logged approval/rejection workflows).

- **Base URL**: `http://localhost:4000/api`
- **Frontend Proxy**: Next.js automatically rewrites `/api/*` to the backend.
- **Content-Type**: `application/json`

---

## 2. Authentication & Authorization

Protected endpoints require a standard JWT bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

- Public: Anyone can view published events, test duplicates, and submit misinformation reports.
- Contributor / Authenticated: Can request OTPs, submit events, and view submission statuses.
- Administrator: Can access `/api/admin/*` to approve/reject events and resolve reports.

---

## 3. Contact Verification APIs

### 3.1 `POST /api/contact/send-otp`
Sends a secure 6-digit verification code to a mobile phone (SMS) or email address.

#### Request Body
```json
{
  "contactType": "EMAIL", // "PHONE" or "EMAIL"
  "contactValue": "organizer@keralatrust.org",
  "submissionRef": "draft_001" // optional
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Verification code sent successfully to or***r@keralatrust.org",
  "data": {
    "success": true,
    "message": "Verification code sent successfully to or***r@keralatrust.org",
    "expiresInSeconds": 300,
    "cooldownSeconds": 60,
    "contactType": "EMAIL",
    "contactValue": "organizer@keralatrust.org"
  }
}
```

#### Errors
- `429 Too Many Requests`: Triggered if requested within the 60-second cooldown window.

---

### 3.2 `POST /api/contact/verify-otp`
Validates the user-entered 6-digit OTP against the stored bcrypt hash.

#### Request Body
```json
{
  "contactType": "EMAIL",
  "contactValue": "organizer@keralatrust.org",
  "otp": "478651"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email address verified successfully.",
  "data": {
    "success": true,
    "message": "Email address verified successfully.",
    "verifiedAt": "2026-11-05T18:00:00.000Z"
  }
}
```

#### Errors
- `400 Bad Request`: Invalid OTP (returns remaining attempts), expired code, or max attempts (5) exceeded.

---

### 3.3 `POST /api/contact/resend-otp`
Resends the verification code respecting the 60-second cooldown window.

---

## 4. Intelligent Duplicate Detection (RAG Vector Engine)

### 4.1 `POST /api/events/check-duplicate`
Compares a proposed event against existing database records using 384-dimensional dense semantic vector embeddings and structured metadata (dates, locations, organizers).

#### Request Body
```json
{
  "title": "Traditional Music Festival",
  "description": "An evening celebrating classical Sopana Sangeetham and percussion in Kunnamkulam.",
  "culturalBackground": "Rooted in central Kerala temple music.",
  "artForm": "Music",
  "eventType": "Festival",
  "eventDate": "2026-11-20",
  "locality": "Kunnamkulam",
  "organizerName": "Kunnamkulam Heritage Society"
}
```

#### Response: Exact Duplicate Detected (Blocked)
```json
{
  "success": true,
  "isDuplicate": true,
  "message": "An event with these details already exists on The Living Culture Map.",
  "matches": [
    {
      "id": "event_001",
      "title": "Traditional Music Festival",
      "eventDate": "2026-11-20",
      "locality": "Kunnamkulam",
      "organizerName": "Kunnamkulam Heritage Society",
      "similarity": 0.96,
      "status": "Published",
      "matchReason": "Identical event instance with matching date and locality."
    }
  ]
}
```

#### Response: Separate Edition / Workshop Instance (Warning with User Review)
```json
{
  "success": true,
  "isDuplicate": false,
  "requiresReview": true,
  "message": "Similar event(s) detected. Please review existing listings to confirm this is a distinct event.",
  "matches": [
    {
      "id": "event_001",
      "title": "Traditional Music Festival",
      "eventDate": "2026-11-20",
      "similarity": 0.74,
      "status": "Published",
      "matchReason": "Existing edition found on 2026-11-20. Check if this is a separate annual festival edition."
    }
  ]
}
```

---

## 5. Cultural Event Creation & Submission

### 5.1 `POST /api/events`
Creates an event submission. Requires:
1. Contact verification (phone or email verified via OTP).
2. Supporting external resource links (minimum 1 valid link).
3. Terms and conditions acceptance (`termsAccepted: true`).
4. Passing duplicate detection.

#### Request Body
```json
{
  "title": "Muringoor Folk Dance Gala",
  "description": "An exceptional community celebration featuring rare Kaikottikali and Kolkali traditional folk dance styles.",
  "culturalBackground": "Traditional agrarian harvest folk dances of central Kerala passed down through generations.",
  "artForm": "Dance",
  "eventType": "Performance",
  "locality": "Chalakudy",
  "neighborhood": "Muringoor",
  "address": "Near River Bridge, Muringoor, Chalakudy, Kerala",
  "latitude": 10.312,
  "longitude": 76.331,
  "eventDate": "2026-12-05",
  "startTime": "17:00",
  "endTime": "21:00",
  "costType": "Free",
  "organizerName": "Muringoor Arts Guild",
  "organizerEmail": "organizer@muringoor.org",
  "emailVerified": true,
  "resources": [
    {
      "resourceTitle": "Official Festival Website",
      "resourceType": "WEBSITE",
      "resourceUrl": "https://muringoorfolkarts.org",
      "description": "Schedule and artist lineup"
    }
  ],
  "termsAccepted": true,
  "termsVersion": "1.0"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Event submitted successfully. Awaiting admin review.",
  "data": {
    "eventId": "event_uuid_123",
    "status": "PENDING_REVIEW",
    "phoneVerified": false,
    "emailVerified": true
  }
}
```

---

### 5.2 `GET /api/events/my-submissions`
Fetches all submissions created by the authenticated user along with publication status and administrative feedback.

---

## 6. Misinformation Reporting

### 6.1 `POST /api/events/:id/report`
Enables community members to report inaccurate or fraudulent event information.

#### Report Categories
- `EVENT_DOES_NOT_EXIST`
- `INCORRECT_DATE_OR_TIME`
- `INCORRECT_LOCATION`
- `FAKE_ORGANIZER_OR_CONTACT`
- `MISLEADING_CULTURAL_INFO`
- `INCORRECT_DESCRIPTION`
- `DUPLICATE_EVENT`
- `BROKEN_REGISTRATION_LINK`
- `OTHER`

#### Request Body
```json
{
  "reportCategory": "INCORRECT_DATE_OR_TIME",
  "reportDescription": "The event starts at 19:00 instead of 18:00 as per the temple trust bulletin.",
  "evidenceUrl": "https://templeboard.kerala.gov.in/notice",
  "reporterContact": "informant@example.com"
}
```

---

## 7. Administrator Moderation APIs

*(Requires JWT with role `ADMIN`)*

### 7.1 `GET /api/admin/events/pending`
Returns pending event submissions with verified contact flags, external resource links, terms timestamps, and submitter info.

### 7.2 `PATCH /api/admin/events/:id/approve`
Approves submission, setting `publicationStatus = PUBLISHED` and `verificationStatus = VERIFIED`. Records audit log.
```json
{
  "notes": "Verified with festival trust committee via telephone. Approved."
}
```

### 7.3 `PATCH /api/admin/events/:id/reject`
Rejects submission, setting `publicationStatus = REJECTED`.
```json
{
  "notes": "Insufficient supporting documentation. Please provide official trust circular."
}
```

### 7.4 `GET /api/admin/reports`
Lists community misinformation reports with filtering by status (`PENDING`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`).

### 7.5 `PATCH /api/admin/reports/:id`
Updates report status and records investigation notes.

---

## 8. Multi-Criteria Discovery Filtering APIs

- `GET /api/events/filter`: Multi-criteria querying (`artForm`, `eventType`, `cost`, `date`, `locality`, `latitude`, `longitude`, `radius`, `sortBy`).
- `GET /api/events/filter-options`: Dynamic categories, art forms, and active localities.
- `GET /api/events`: All published events (paginated).
- `GET /api/events/:id`: Single event details.
