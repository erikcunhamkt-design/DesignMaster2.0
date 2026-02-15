
-- Licenses table
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'inactive',
  expires_at timestamptz NULL,
  kiwify_order_id text NULL,
  kiwify_subscription_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook events (idempotency)
CREATE TABLE public.webhook_events (
  event_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS: users can read their own license
CREATE POLICY "Users can read own license"
  ON public.licenses FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: service role inserts/updates (webhook)
-- No public insert/update/delete for licenses
CREATE POLICY "Service role full access on licenses"
  ON public.licenses FOR ALL
  USING (auth.role() = 'service_role');

-- RLS: service role for webhook_events
CREATE POLICY "Service role full access on webhook_events"
  ON public.webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-create license on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.licenses (user_id, email, plan, status)
  VALUES (NEW.id, NEW.email, 'monthly', 'inactive');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
