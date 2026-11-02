-- Apply from the Supabase SQL Editor. The service_role used by the Kobo Edge
-- Function keeps access; browser sessions must carry an admin-managed staff role.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('service_desk_tickets', 'kobo_submissions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

REVOKE ALL ON public.kobo_submissions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.kobo_submissions TO service_role;

REVOKE ALL ON public.service_desk_tickets FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_desk_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_desk_tickets TO service_role;

ALTER TABLE public.kobo_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_desk_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Desk staff can manage tickets"
ON public.service_desk_tickets
FOR ALL TO authenticated
USING (
  auth.jwt() -> 'app_metadata' ->> 'service_desk_role'
  IN ('service-desk', 'resp-tecnico', 'resp-contenido', 'dueno')
)
WITH CHECK (
  auth.jwt() -> 'app_metadata' ->> 'service_desk_role'
  IN ('service-desk', 'resp-tecnico', 'resp-contenido', 'dueno')
);
