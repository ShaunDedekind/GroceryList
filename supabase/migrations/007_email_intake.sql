-- Email intake enrichments + item source linkage

ALTER TABLE inbound_emails
  ADD COLUMN IF NOT EXISTS parse_result jsonb,
  ADD COLUMN IF NOT EXISTS confidence real,
  ADD COLUMN IF NOT EXISTS decision text,
  ADD COLUMN IF NOT EXISTS body_excerpt text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS storage_ref text;

ALTER TABLE inbound_emails DROP CONSTRAINT IF EXISTS inbound_emails_decision_check;
ALTER TABLE inbound_emails
  ADD CONSTRAINT inbound_emails_decision_check
  CHECK (
    decision IS NULL OR
    decision IN ('auto_filed', 'needs_review', 'rejected')
  );

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS inbound_email_id uuid REFERENCES inbound_emails(id) ON DELETE SET NULL;

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_source_check;
ALTER TABLE items
  ADD CONSTRAINT items_source_check
  CHECK (source IS NULL OR source IN ('manual', 'email', 'nl'));
