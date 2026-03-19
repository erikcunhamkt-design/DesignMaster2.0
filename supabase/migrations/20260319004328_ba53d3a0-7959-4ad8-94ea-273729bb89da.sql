
CREATE TABLE public.void_brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Minha Marca',
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.void_brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own brand kits" ON public.void_brand_kits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand kits" ON public.void_brand_kits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand kits" ON public.void_brand_kits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand kits" ON public.void_brand_kits FOR DELETE TO authenticated USING (auth.uid() = user_id);
