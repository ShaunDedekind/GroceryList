CREATE TABLE ai_parse_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_parse_usage_list_created_idx ON ai_parse_usage (list_id, created_at DESC);

ALTER TABLE ai_parse_usage ENABLE ROW LEVEL SECURITY;
