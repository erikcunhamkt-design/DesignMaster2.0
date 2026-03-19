
-- Create void_projects table
CREATE TABLE public.void_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Sem título',
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.void_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own projects" ON public.void_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.void_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.void_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.void_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add project_id to void_canvas_nodes (nullable for backward compat)
ALTER TABLE public.void_canvas_nodes ADD COLUMN project_id UUID REFERENCES public.void_projects(id) ON DELETE CASCADE;
