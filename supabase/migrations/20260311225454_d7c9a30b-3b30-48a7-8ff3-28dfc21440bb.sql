
-- =============================================
-- FIX 1: Convert user-facing RESTRICTIVE policies to PERMISSIVE
-- FIX 2: Fix direct_conversations UPDATE WITH CHECK
-- =============================================

-- ==================== chat_conversations ====================
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ==================== chat_messages ====================
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can read own messages" ON public.chat_messages;

CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can read own messages" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

-- ==================== chat_user_status ====================
DROP POLICY IF EXISTS "Users can read own status" ON public.chat_user_status;
CREATE POLICY "Users can read own status" ON public.chat_user_status FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== community_messages ====================
DROP POLICY IF EXISTS "Active users can insert community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Authenticated can read community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Users can delete own community messages" ON public.community_messages;

CREATE POLICY "Active users can insert community messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND get_chat_status(auth.uid()) = 'active'::chat_status);
CREATE POLICY "Authenticated can read community messages" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can delete own community messages" ON public.community_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- ==================== direct_conversations ====================
DROP POLICY IF EXISTS "Authenticated can create dm conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Participants can read own dm conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Participants can update dm conversations" ON public.direct_conversations;

CREATE POLICY "Authenticated can create dm conversations" ON public.direct_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Participants can read own dm conversations" ON public.direct_conversations FOR SELECT TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
-- FIX 2: Use OLD values via subquery to prevent participant swapping
CREATE POLICY "Participants can update dm conversations" ON public.direct_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (
    participant_1 = (SELECT dc.participant_1 FROM public.direct_conversations dc WHERE dc.id = direct_conversations.id)
    AND participant_2 = (SELECT dc.participant_2 FROM public.direct_conversations dc WHERE dc.id = direct_conversations.id)
  );

-- ==================== direct_messages ====================
DROP POLICY IF EXISTS "Participants can read dm messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Active participants can insert dm messages" ON public.direct_messages;

CREATE POLICY "Participants can read dm messages" ON public.direct_messages FOR SELECT TO authenticated USING (is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Active participants can insert dm messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND is_conversation_participant(auth.uid(), conversation_id) AND get_chat_status(auth.uid()) = 'active'::chat_status);

-- ==================== friendships ====================
DROP POLICY IF EXISTS "Only addressee can update friendship" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can read own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;

CREATE POLICY "Only addressee can update friendship" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND requester_id <> addressee_id);

-- ==================== licenses ====================
DROP POLICY IF EXISTS "Users can read own license" ON public.licenses;
CREATE POLICY "Users can read own license" ON public.licenses FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== notification_reads ====================
DROP POLICY IF EXISTS "Users can mark as read" ON public.notification_reads;
DROP POLICY IF EXISTS "Users can read own reads" ON public.notification_reads;

CREATE POLICY "Users can mark as read" ON public.notification_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own reads" ON public.notification_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== notifications ====================
DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;
CREATE POLICY "Authenticated can read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- ==================== profiles ====================
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ==================== user_allowed_ips ====================
DROP POLICY IF EXISTS "Users can read own ips" ON public.user_allowed_ips;
CREATE POLICY "Users can read own ips" ON public.user_allowed_ips FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== user_favorites ====================
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can read own favorites" ON public.user_favorites;

CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own favorites" ON public.user_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ==================== user_recent_tools ====================
DROP POLICY IF EXISTS "Users can insert own recents" ON public.user_recent_tools;
DROP POLICY IF EXISTS "Users can read own recents" ON public.user_recent_tools;
DROP POLICY IF EXISTS "Users can update own recents" ON public.user_recent_tools;

CREATE POLICY "Users can insert own recents" ON public.user_recent_tools FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own recents" ON public.user_recent_tools FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own recents" ON public.user_recent_tools FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ==================== user_roles ====================
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
