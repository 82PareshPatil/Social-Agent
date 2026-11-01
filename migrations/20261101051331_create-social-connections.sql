-- Social accounts a user connects via OAuth (Instagram first). Tokens are stored encrypted by the
-- app server (AES-256-GCM); the ciphertext column is not selectable directly by clients.
CREATE TABLE public.social_connections (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('instagram')),
  provider_account_id text NOT NULL,
  username text,
  account_type text,
  access_token_enc text NOT NULL,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_account_id)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_connections'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.social_connections', p.policyname);
  END LOOP;
END;
$$;

REVOKE ALL ON public.social_connections FROM PUBLIC, anon, authenticated;
-- Everything except the token ciphertext can be read by the owner; rows can be removed (disconnect).
GRANT SELECT (id, user_id, provider, provider_account_id, username, account_type, token_expires_at, scopes, status, created_at, updated_at)
  ON public.social_connections TO authenticated;
GRANT DELETE ON public.social_connections TO authenticated;

CREATE POLICY social_connections_owner_select ON public.social_connections
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY social_connections_owner_delete ON public.social_connections
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- Create or refresh a connection for the signed-in user. The owner is always auth.uid().
CREATE FUNCTION public.save_social_connection(
  p_provider text, p_account_id text, p_username text, p_account_type text,
  p_token_enc text, p_expires_at timestamptz, p_scopes text[]
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  connection_id bigint;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.social_connections AS c
    (user_id, provider, provider_account_id, username, account_type, access_token_enc, token_expires_at, scopes, status)
  VALUES (uid, p_provider, p_account_id, p_username, p_account_type, p_token_enc, p_expires_at, COALESCE(p_scopes, '{}'), 'connected')
  ON CONFLICT (user_id, provider, provider_account_id) DO UPDATE SET
    username = EXCLUDED.username, account_type = EXCLUDED.account_type,
    access_token_enc = EXCLUDED.access_token_enc, token_expires_at = EXCLUDED.token_expires_at,
    scopes = EXCLUDED.scopes, status = 'connected', updated_at = now()
  RETURNING c.id INTO connection_id;
  RETURN connection_id;
END;
$$;

-- Server-only read of the encrypted token for one of the caller's own connections.
CREATE FUNCTION public.get_social_connection_secret(p_id bigint)
RETURNS TABLE (access_token_enc text, token_expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT c.access_token_enc, c.token_expires_at FROM public.social_connections c
  WHERE c.id = p_id AND c.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.save_social_connection(text, text, text, text, text, timestamptz, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_social_connection_secret(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_social_connection(text, text, text, text, text, timestamptz, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_social_connection_secret(bigint) TO authenticated;
