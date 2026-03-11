
CREATE TABLE public.user_allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, ip_address)
);

ALTER TABLE public.user_allowed_ips ENABLE ROW LEVEL SECURITY;

-- Users can read own IPs
CREATE POLICY "Users can read own ips" ON public.user_allowed_ips
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Service role full access (edge function uses service role)
CREATE POLICY "Service role full access on user_allowed_ips" ON public.user_allowed_ips
FOR ALL TO public
USING (auth.role() = 'service_role'::text);

-- Admins can manage all IPs
CREATE POLICY "Admins can manage all ips" ON public.user_allowed_ips
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
