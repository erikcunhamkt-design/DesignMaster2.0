
CREATE TABLE public.user_recent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_id text NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, studio_id)
);

ALTER TABLE public.user_recent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recents"
  ON public.user_recent_tools
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recents"
  ON public.user_recent_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recents"
  ON public.user_recent_tools
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
