-- NL parse usage tracking for Vercel /api/parse-item
CREATE TABLE IF NOT EXISTS ai_nl_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_nl_usage_list_created_idx
  ON ai_nl_usage (list_id, created_at DESC);

ALTER TABLE ai_nl_usage ENABLE ROW LEVEL SECURITY;
-- No client policies — service role only (same pattern as ai_parse_usage)

GRANT ALL ON ai_nl_usage TO service_role;
