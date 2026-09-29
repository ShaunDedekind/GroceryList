-- Henry tab: section + due_at/note, inbound email / documents / calendar scaffolding

-- Expand section check to include henry
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_section_check;
ALTER TABLE items
  ADD CONSTRAINT items_section_check
  CHECK (section IN ('grocery', 'home', 'henry'));

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS items_list_section_due_at_idx
  ON items (list_id, section, due_at);

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS henry_category_config jsonb NOT NULL DEFAULT '{}';

-- Inbound emails (forwarded docs / appointment mail)
CREATE TABLE IF NOT EXISTS inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  from_address text,
  subject text,
  body_text text,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed')),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS inbound_emails_list_id_idx ON inbound_emails (list_id);
CREATE INDEX IF NOT EXISTS inbound_emails_received_at_idx ON inbound_emails (list_id, received_at DESC);

-- Stored documents (PDFs, attachments)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  inbound_email_id uuid REFERENCES inbound_emails(id) ON DELETE SET NULL,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_list_id_idx ON documents (list_id);

-- Google Calendar connection (tokens wired later)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected', 'revoked')),
  external_account text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_connections_list_id_idx ON calendar_connections (list_id);

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES calendar_connections(id) ON DELETE SET NULL,
  external_event_id text,
  title text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_list_id_idx ON calendar_events (list_id);
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_external_uidx
  ON calendar_events (list_id, external_event_id)
  WHERE external_event_id IS NOT NULL;

-- RLS
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbound_emails_select" ON inbound_emails
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "inbound_emails_insert" ON inbound_emails
  FOR INSERT WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "inbound_emails_update" ON inbound_emails
  FOR UPDATE USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "inbound_emails_delete" ON inbound_emails
  FOR DELETE USING (list_id = public.current_list_id());

CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "documents_insert" ON documents
  FOR INSERT WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "documents_update" ON documents
  FOR UPDATE USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "documents_delete" ON documents
  FOR DELETE USING (list_id = public.current_list_id());

CREATE POLICY "calendar_connections_select" ON calendar_connections
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "calendar_connections_insert" ON calendar_connections
  FOR INSERT WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "calendar_connections_update" ON calendar_connections
  FOR UPDATE USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "calendar_connections_delete" ON calendar_connections
  FOR DELETE USING (list_id = public.current_list_id());

CREATE POLICY "calendar_events_select" ON calendar_events
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "calendar_events_insert" ON calendar_events
  FOR INSERT WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "calendar_events_update" ON calendar_events
  FOR UPDATE USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "calendar_events_delete" ON calendar_events
  FOR DELETE USING (list_id = public.current_list_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON inbound_emails TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_connections TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO anon, authenticated;

-- Private storage bucket for PDFs / attachments
-- Path convention: {list_id}/{document_id}/{filename}
INSERT INTO storage.buckets (id, name, public)
VALUES ('list-documents', 'list-documents', false)
ON CONFLICT (id) DO NOTHING;
