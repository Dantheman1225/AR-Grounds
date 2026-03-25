-- ================================================
-- AR Grounds — Supabase Schema
-- Run in Supabase SQL Editor
-- ================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── LEADS ─────────────────────────────────────────
-- Captured from quote form and contact form
CREATE TABLE IF NOT EXISTS leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  service    TEXT,           -- driveway | sidewalk | bundle | unsure
  size       TEXT,           -- small | medium | large | unsure
  timing     TEXT,           -- morning | afternoon | evening
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'new',  -- new | quoted | booked | done
  source     TEXT DEFAULT 'quote_form',    -- quote_form | contact | manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CUSTOMERS ─────────────────────────────────────
-- Created when a lead is converted (booked)
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID REFERENCES leads(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOBS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID REFERENCES customers(id) ON DELETE CASCADE,
  service      TEXT,           -- driveway | sidewalk | bundle
  status       TEXT DEFAULT 'scheduled',  -- scheduled | in_progress | done | cancelled
  price        NUMERIC(10,2),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  stripe_link  TEXT,           -- Stripe Payment Link URL
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PHOTOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,  -- path in Supabase Storage
  label        TEXT,           -- e.g. "Driveway - East side"
  type         TEXT,           -- before | after
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2),
  stripe_link TEXT,
  status      TEXT DEFAULT 'sent',  -- sent | paid | overdue | cancelled
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  paid_at     TIMESTAMPTZ
);

-- ── INDEXES ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_status_idx    ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_idx   ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_customer_idx   ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS photos_job_idx      ON photos(job_id);
CREATE INDEX IF NOT EXISTS payments_job_idx    ON payments(job_id);
