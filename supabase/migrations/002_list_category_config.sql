-- Per-list aisle section customization (order, visibility, labels)

ALTER TABLE lists
  ADD COLUMN IF NOT EXISTS category_config jsonb NOT NULL DEFAULT '{}';
