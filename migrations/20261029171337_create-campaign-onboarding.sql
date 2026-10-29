CREATE TABLE public.campaigns (
 id serial PRIMARY KEY,
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
 icon text,
 icon_url text,
 icon_key text,
 office_image text NOT NULL CHECK (office_image IN ('/offices/modern-office.png','/offices/wooden-office.png')),
 created_at timestamp NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='campaigns' LOOP
 EXECUTE format('DROP POLICY %I ON public.campaigns',p.policyname);
 END LOOP;
END $$;
REVOKE ALL ON public.campaigns FROM anon, authenticated;
GRANT SELECT, INSERT ON public.campaigns TO authenticated;
GRANT USAGE ON SEQUENCE public.campaigns_id_seq TO authenticated;
CREATE POLICY campaigns_owner_select ON public.campaigns FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY campaigns_owner_insert ON public.campaigns FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()) AND (icon_key IS NULL OR (storage.foldername(icon_key))[1]=auth.uid()::text));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_icons_path_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (bucket <> 'campaign-icons' OR ((storage.foldername(key))[1]=auth.uid()::text AND uploaded_by=auth.uid()::text));
CREATE POLICY campaign_icons_path_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING (bucket <> 'campaign-icons' OR ((storage.foldername(key))[1]=auth.uid()::text AND uploaded_by=auth.uid()::text));
