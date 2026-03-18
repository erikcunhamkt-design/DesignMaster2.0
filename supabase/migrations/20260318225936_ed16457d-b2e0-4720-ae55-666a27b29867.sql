
-- Table to store VOID canvas nodes (images, text, etc.)
CREATE TABLE public.void_canvas_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT '',
  node_type text NOT NULL DEFAULT 'image',
  image_url text,
  prompt text,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  width float NOT NULL DEFAULT 256,
  height float NOT NULL DEFAULT 256,
  z_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table to store connections between nodes
CREATE TABLE public.void_canvas_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL REFERENCES public.void_canvas_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.void_canvas_nodes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.void_canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.void_canvas_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for nodes
CREATE POLICY "Users can read own nodes" ON public.void_canvas_nodes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nodes" ON public.void_canvas_nodes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nodes" ON public.void_canvas_nodes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nodes" ON public.void_canvas_nodes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for connections
CREATE POLICY "Users can read own connections" ON public.void_canvas_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.void_canvas_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.void_canvas_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_void_canvas_nodes_updated_at BEFORE UPDATE ON public.void_canvas_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
