-- Web Push subscriptions + notification prefs (service-account calendar uses existing calendar_* tables)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  person text NOT NULL CHECK (person IN ('shaun', 'rosie')),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_list_idx ON push_subscriptions (list_id);

CREATE TABLE IF NOT EXISTS notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  person text NOT NULL CHECK (person IN ('shaun', 'rosie')),
  bills_3d boolean NOT NULL DEFAULT true,
  bills_due_day boolean NOT NULL DEFAULT true,
  sessions_eve boolean NOT NULL DEFAULT true,
  maintenance_weekly boolean NOT NULL DEFAULT true,
  UNIQUE (list_id, person)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (list_id = public.current_list_id());
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE USING (list_id = public.current_list_id());

CREATE POLICY "notification_prefs_select" ON notification_prefs
  FOR SELECT USING (list_id = public.current_list_id());
CREATE POLICY "notification_prefs_upsert" ON notification_prefs
  FOR ALL USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_prefs TO anon, authenticated;

-- Mark calendar_connections as service-account style when connected
COMMENT ON TABLE calendar_connections IS 'Home OS uses Google service account; status=connected when GOOGLE_CALENDAR_ID is configured.';
