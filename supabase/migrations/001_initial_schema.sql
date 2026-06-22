-- Grocery List schema with code-based access via x-list-code header

-- Helper: validate list code from request header and set session variable
CREATE OR REPLACE FUNCTION public.check_request()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  headers json;
  list_code text;
  list_uuid uuid;
BEGIN
  headers := current_setting('request.headers', true)::json;
  list_code := UPPER(TRIM(headers->>'x-list-code'));

  IF list_code IS NULL OR list_code = '' THEN
    RETURN;
  END IF;

  SELECT id INTO list_uuid FROM lists WHERE code = list_code;

  IF list_uuid IS NOT NULL THEN
    PERFORM set_config('app.current_list_id', list_uuid::text, true);
    PERFORM set_config('app.current_list_code', list_code, true);
  END IF;
END;
$$;

-- Pre-request hook for PostgREST
ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.check_request';
NOTIFY pgrst, 'reload config';

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'Our Grocery List',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lists_code_idx ON lists (code);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  text text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  added_by text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_list_id_idx ON items (list_id);
CREATE INDEX IF NOT EXISTS items_list_category_idx ON items (list_id, category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RPC: Create a new list (no header required)
CREATE OR REPLACE FUNCTION public.create_list(p_code text, p_name text DEFAULT 'Our Grocery List')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_list lists%ROWTYPE;
BEGIN
  INSERT INTO lists (code, name)
  VALUES (UPPER(TRIM(p_code)), TRIM(p_name))
  RETURNING * INTO new_list;

  RETURN json_build_object(
    'id', new_list.id,
    'code', new_list.code,
    'name', new_list.name
  );
END;
$$;

-- RPC: Join an existing list by code (no header required)
CREATE OR REPLACE FUNCTION public.join_list(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_list lists%ROWTYPE;
BEGIN
  SELECT * INTO found_list FROM lists WHERE code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', found_list.id,
    'code', found_list.code,
    'name', found_list.name
  );
END;
$$;

-- RLS helper
CREATE OR REPLACE FUNCTION public.current_list_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_list_id', true), '')::uuid;
$$;

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Lists policies: read/update own list via code header
CREATE POLICY "lists_select" ON lists
  FOR SELECT
  USING (id = public.current_list_id());

CREATE POLICY "lists_update" ON lists
  FOR UPDATE
  USING (id = public.current_list_id())
  WITH CHECK (id = public.current_list_id());

-- Items policies: full CRUD for current list
CREATE POLICY "items_select" ON items
  FOR SELECT
  USING (list_id = public.current_list_id());

CREATE POLICY "items_insert" ON items
  FOR INSERT
  WITH CHECK (list_id = public.current_list_id());

CREATE POLICY "items_update" ON items
  FOR UPDATE
  USING (list_id = public.current_list_id())
  WITH CHECK (list_id = public.current_list_id());

CREATE POLICY "items_delete" ON items
  FOR DELETE
  USING (list_id = public.current_list_id());

-- Allow anon to call RPC functions
GRANT EXECUTE ON FUNCTION public.create_list(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_list(text) TO anon, authenticated;

-- Grant table access to anon (RLS restricts rows)
GRANT SELECT, UPDATE ON lists TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO anon, authenticated;

-- Enable realtime for items and lists
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
