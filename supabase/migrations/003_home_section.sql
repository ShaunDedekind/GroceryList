-- Home tab: section discriminator on items + per-list home category config

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'grocery'
  CHECK (section IN ('grocery', 'home'));

CREATE INDEX IF NOT EXISTS items_list_section_idx ON items (list_id, section);

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS home_category_config jsonb NOT NULL DEFAULT '{}';
