-- Home OS foundation: ownership, item kinds, bill fields, recurrence
-- Does not drop grocery section or rows.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS owner text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS amount_cents integer,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence jsonb;

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_owner_check;
ALTER TABLE items
  ADD CONSTRAINT items_owner_check
  CHECK (owner IN ('shaun', 'rosie', 'shared'));

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_item_kind_check;
ALTER TABLE items
  ADD CONSTRAINT items_item_kind_check
  CHECK (item_kind IN ('task', 'bill', 'session', 'maintenance', 'purchase', 'milestone'));

UPDATE items
SET owner = CASE
  WHEN lower(coalesce(added_by, '')) ~ '(^|\s)(shaun|shawn)(\s|$)' THEN 'shaun'
  WHEN lower(coalesce(added_by, '')) ~ '(^|\s)(rosie|rose)(\s|$)' THEN 'rosie'
  ELSE owner
END
WHERE owner = 'shared';

-- Legacy category renames (app also normalizes at read time)
UPDATE items
SET category = 'purchases'
WHERE section = 'home' AND category = 'projects';

UPDATE items
SET category = 'activities'
WHERE section = 'henry' AND category = 'appointments';

UPDATE items
SET category = 'gear'
WHERE section = 'henry' AND category = 'supplies';

CREATE INDEX IF NOT EXISTS items_list_section_due_checked_idx
  ON items (list_id, section, due_at, checked);
