DO $$
BEGIN
  -- Ensure profiles has a primary key on id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_pkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
  END IF;
END$$;

-- Backfill missing profiles for existing users so posts.author_id FKs can resolve
INSERT INTO public.profiles (id, display_name, created_at, updated_at)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1)
  ) AS display_name,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p
  ON p.id = u.id
WHERE p.id IS NULL;