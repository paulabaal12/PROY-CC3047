-- Internal state used by the scheduled UptimeRobot poller to avoid duplicate tickets.
CREATE TABLE IF NOT EXISTS public.uptimerobot_monitor_state (
  monitor_id text PRIMARY KEY,
  monitor_status text NOT NULL CHECK (monitor_status IN ('up', 'down')),
  ticket_id text REFERENCES public.service_desk_tickets(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uptimerobot_monitor_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.uptimerobot_monitor_state FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uptimerobot_monitor_state TO service_role;
