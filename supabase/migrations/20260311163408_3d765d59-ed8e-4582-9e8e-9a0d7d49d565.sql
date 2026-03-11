
-- Profiles table for display names
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Chat user status
CREATE TYPE public.chat_status AS ENUM ('active', 'muted', 'banned');

CREATE TABLE public.chat_user_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status chat_status NOT NULL DEFAULT 'active',
  muted_until timestamptz,
  reason text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_user_status ENABLE ROW LEVEL SECURITY;

-- Security definer to check chat status
CREATE OR REPLACE FUNCTION public.get_chat_status(_user_id uuid)
RETURNS chat_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN status = 'muted' AND muted_until IS NOT NULL AND muted_until < now() THEN 'active'::chat_status
        ELSE status
      END
    FROM public.chat_user_status WHERE user_id = _user_id),
    'active'::chat_status
  )
$$;

CREATE POLICY "Users can read own status" ON public.chat_user_status FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all chat status" ON public.chat_user_status FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Community messages
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read community messages" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Active users can insert community messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND public.get_chat_status(auth.uid()) = 'active'
);
CREATE POLICY "Users can delete own community messages" ON public.community_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Direct conversations
CREATE TABLE public.direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.direct_conversations
    WHERE id = _conversation_id
    AND (participant_1 = _user_id OR participant_2 = _user_id)
  )
$$;

CREATE POLICY "Participants can read own dm conversations" ON public.direct_conversations FOR SELECT TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Authenticated can create dm conversations" ON public.direct_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Participants can update dm conversations" ON public.direct_conversations FOR UPDATE TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read dm messages" ON public.direct_messages FOR SELECT TO authenticated USING (public.is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Active participants can insert dm messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND public.is_conversation_participant(auth.uid(), conversation_id) AND public.get_chat_status(auth.uid()) = 'active'
);
CREATE POLICY "Admins can delete dm messages" ON public.direct_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Authenticated can upload chat media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-media');
CREATE POLICY "Anyone can view chat media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-media');
CREATE POLICY "Admins can delete chat media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-media' AND public.has_role(auth.uid(), 'admin'));
