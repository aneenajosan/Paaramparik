-- Migration: 20261105000000_init
-- Complete Database schema for Paaramparik (PostgreSQL)
-- Includes Cultural Event Filtering, Contact OTP Verification, RAG Embeddings,
-- Misinformation Reporting, Terms Acceptance, and Admin Moderation.

-- Create Enums
CREATE TYPE "ArtForm" AS ENUM (
    'MUSIC',
    'DANCE',
    'THEATRE',
    'VISUAL_ARTS',
    'CRAFTS',
    'LITERATURE',
    'TRADITIONAL_RITUAL_ARTS',
    'OTHER'
);

CREATE TYPE "EventType" AS ENUM (
    'FESTIVAL',
    'WORKSHOP',
    'PERFORMANCE',
    'EXHIBITION',
    'CULTURAL_GATHERING',
    'HERITAGE_EVENT',
    'OTHER'
);

CREATE TYPE "CostType" AS ENUM (
    'FREE',
    'PAID',
    'UNKNOWN'
);

CREATE TYPE "VerificationStatus" AS ENUM (
    'VERIFIED',
    'COMMUNITY_SUBMITTED',
    'PENDING_VERIFICATION'
);

CREATE TYPE "PublicationStatus" AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED'
);

CREATE TYPE "UserRole" AS ENUM (
    'USER',
    'CONTRIBUTOR',
    'ADMIN'
);

CREATE TYPE "ContactType" AS ENUM (
    'PHONE',
    'EMAIL'
);

CREATE TYPE "ResourceType" AS ENUM (
    'INSTAGRAM',
    'FACEBOOK',
    'WEBSITE',
    'REGISTRATION',
    'YOUTUBE',
    'GOVERNMENT',
    'OTHER'
);

CREATE TYPE "ReportCategory" AS ENUM (
    'EVENT_DOES_NOT_EXIST',
    'INCORRECT_DATE_OR_TIME',
    'INCORRECT_LOCATION',
    'FAKE_ORGANIZER_OR_CONTACT',
    'MISLEADING_CULTURAL_INFO',
    'INCORRECT_DESCRIPTION',
    'DUPLICATE_EVENT',
    'BROKEN_REGISTRATION_LINK',
    'OTHER'
);

CREATE TYPE "ReportStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED'
);

-- Users Table
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cultural_background" TEXT,
    "art_form" "ArtForm" NOT NULL,
    "event_type" "EventType" NOT NULL,
    "locality" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_end" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "cost_type" "CostType" NOT NULL DEFAULT 'UNKNOWN',
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "organizer_name" TEXT,
    "organizer_contact" TEXT,
    "organizer_phone" TEXT,
    "organizer_email" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified_at" TIMESTAMP(3),
    "email_verified_at" TIMESTAMP(3),
    "accessibility" TEXT,
    "source_url" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contributor_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contact Verifications Table
CREATE TABLE "contact_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "submission_ref" TEXT,
    "contact_type" "ContactType" NOT NULL,
    "contact_value" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Resources Table
CREATE TABLE "event_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "resource_title" TEXT NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "resource_url" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Embeddings Table (RAG Vector Store)
CREATE TABLE "event_embeddings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL UNIQUE REFERENCES "events"("id") ON DELETE CASCADE,
    "embedding_text" TEXT NOT NULL,
    "embedding_model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "vector_data" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Reports Table (Misinformation)
CREATE TABLE "event_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "reporter_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "report_category" "ReportCategory" NOT NULL,
    "report_description" TEXT NOT NULL,
    "evidence_url" TEXT,
    "reporter_contact" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Terms Acceptances Table
CREATE TABLE "terms_acceptances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "event_id" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "terms_version" TEXT NOT NULL DEFAULT '1.0',
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Moderation Logs Table
CREATE TABLE "moderation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "moderator_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX "events_art_form_idx" ON "events"("art_form");
CREATE INDEX "events_event_type_idx" ON "events"("event_type");
CREATE INDEX "events_cost_type_idx" ON "events"("cost_type");
CREATE INDEX "events_locality_idx" ON "events"("locality");
CREATE INDEX "events_event_date_idx" ON "events"("event_date");
CREATE INDEX "events_publication_status_idx" ON "events"("publication_status");
CREATE INDEX "events_verification_status_idx" ON "events"("verification_status");
CREATE INDEX "events_lat_lng_idx" ON "events"("latitude", "longitude");
CREATE INDEX "events_contributor_id_idx" ON "events"("contributor_id");

CREATE INDEX "contact_verifications_val_type_idx" ON "contact_verifications"("contact_value", "contact_type");
CREATE INDEX "contact_verifications_submission_ref_idx" ON "contact_verifications"("submission_ref");

CREATE INDEX "event_resources_event_id_idx" ON "event_resources"("event_id");
CREATE INDEX "event_reports_event_id_idx" ON "event_reports"("event_id");
CREATE INDEX "event_reports_status_idx" ON "event_reports"("status");
CREATE INDEX "terms_acceptances_user_id_idx" ON "terms_acceptances"("user_id");
CREATE INDEX "terms_acceptances_event_id_idx" ON "terms_acceptances"("event_id");
CREATE INDEX "moderation_logs_event_id_idx" ON "moderation_logs"("event_id");
