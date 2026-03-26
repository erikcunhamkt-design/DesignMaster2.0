-- Admin reports table (only admin can access)
CREATE TABLE public.admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL,
  file_name text NOT NULL,
  version text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read reports" ON public.admin_reports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reports" ON public.admin_reports
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports" ON public.admin_reports
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on admin_reports" ON public.admin_reports
  FOR ALL TO public
  USING (auth.role() = 'service_role');