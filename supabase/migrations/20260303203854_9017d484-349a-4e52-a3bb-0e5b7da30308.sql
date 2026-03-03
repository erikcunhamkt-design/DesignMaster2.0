
-- Conversations table
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

-- Updated_at trigger for conversations
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
