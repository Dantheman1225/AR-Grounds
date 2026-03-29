-- ================================================
-- Grounds Maintenance — Supabase Row Level Security Policies
-- Run AFTER schema.sql
-- ================================================

-- Enable RLS on all tables
ALTER TABLE leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments  ENABLE ROW LEVEL SECURITY;

-- ── PUBLIC: Allow INSERT on leads (quote form, no auth needed) ────────────────
CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── SERVICE ROLE: Full access for backend functions ────────────────────────
-- (Service role key bypasses RLS by default in Supabase — no policy needed)
-- If you want to be explicit, you can add:
-- CREATE POLICY "Service role full access" ON leads FOR ALL TO service_role USING (true);

-- ── FUTURE: Add admin user policies when Supabase Auth is wired up ─────────
-- Example:
-- CREATE POLICY "Admin can read leads"
--   ON leads FOR SELECT
--   TO authenticated
--   USING (auth.uid() IS NOT NULL);

-- ── STORAGE BUCKET ─────────────────────────────────────────────────────────
-- Run in Supabase Studio → Storage → New Bucket:
--   Name: photos
--   Public: false (serve via signed URLs or your own proxy)
