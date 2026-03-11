
-- Fix: Convert all RESTRICTIVE policies to PERMISSIVE (default)
-- This is required because PostgreSQL needs at least one PERMISSIVE policy to grant access

-- chat_conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- chat_messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can read own messages" ON public.chat_messages;

CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can read own messages" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

-- chat_user_status
DROP POLICY IF EXISTS "Admins can manage all chat status" ON public.chat_user_status;
DROP POLICY IF EXISTS "Users can read own status" ON public.chat_user_status;

CREATE POLICY "Admins can manage all chat status" ON public.chat_user_status FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own status" ON public.chat_user_status FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- community_messages
DROP POLICY IF EXISTS "Active users can insert community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Authenticated can read community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Users can delete own community messages" ON public.community_messages;

CREATE POLICY "Active users can insert community messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (get_chat_status(auth.uid()) = 'active'::chat_status));
CREATE POLICY "Authenticated can read community messages" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can delete own community messages" ON public.community_messages FOR DELETE TO authenticated USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- direct_conversations
DROP POLICY IF EXISTS "Authenticated can create dm conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Participants can read own dm conversations" ON public.direct_conversations;
DROP POLICY IF EXISTS "Participants can update dm conversations" ON public.direct_conversations;

CREATE POLICY "Authenticated can create dm conversations" ON public.direct_conversations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = participant_1) OR (auth.uid() = participant_2));
CREATE POLICY "Participants can read own dm conversations" ON public.direct_conversations FOR SELECT TO authenticated USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));
CREATE POLICY "Participants can update dm conversations" ON public.direct_conversations FOR UPDATE TO authenticated USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

-- direct_messages
DROP POLICY IF EXISTS "Active participants can insert dm messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Admins can delete dm messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Participants can read dm messages" ON public.direct_messages;

CREATE POLICY "Active participants can insert dm messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND is_conversation_participant(auth.uid(), conversation_id) AND (get_chat_status(auth.uid()) = 'active'::chat_status));
CREATE POLICY "Admins can delete dm messages" ON public.direct_messages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Participants can read dm messages" ON public.direct_messages FOR SELECT TO authenticated USING (is_conversation_participant(auth.uid(), conversation_id));

-- friendships (FIX: only addressee can update/accept)
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can read own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships addressed to them" ON public.friendships;

CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE TO authenticated USING ((auth.uid() = requester_id) OR (auth.uid() = addressee_id));
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT TO authenticated USING ((auth.uid() = requester_id) OR (auth.uid() = addressee_id));
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT TO authenticated WITH CHECK ((auth.uid() = requester_id) AND (requester_id <> addressee_id));
CREATE POLICY "Only addressee can update friendship" ON public.friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee_id);

-- licenses
DROP POLICY IF EXISTS "Admins can delete all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can insert licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can read all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Admins can update all licenses" ON public.licenses;
DROP POLICY IF EXISTS "Service role full access on licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can read own license" ON public.licenses;

CREATE POLICY "Admins can delete all licenses" ON public.licenses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert licenses" ON public.licenses FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read all licenses" ON public.licenses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all licenses" ON public.licenses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role full access on licenses" ON public.licenses FOR ALL TO public USING (auth.role() = 'service_role'::text);
CREATE POLICY "Users can read own license" ON public.licenses FOR SELECT TO public USING (auth.uid() = user_id);

-- notification_reads
DROP POLICY IF EXISTS "Users can mark as read" ON public.notification_reads;
DROP POLICY IF EXISTS "Users can read own reads" ON public.notification_reads;

CREATE POLICY "Users can mark as read" ON public.notification_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own reads" ON public.notification_reads FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;

CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_favorites
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can read own favorites" ON public.user_favorites;

CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own favorites" ON public.user_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_recent_tools
DROP POLICY IF EXISTS "Users can insert own recents" ON public.user_recent_tools;
DROP POLICY IF EXISTS "Users can read own recents" ON public.user_recent_tools;
DROP POLICY IF EXISTS "Users can update own recents" ON public.user_recent_tools;

CREATE POLICY "Users can insert own recents" ON public.user_recent_tools FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own recents" ON public.user_recent_tools FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own recents" ON public.user_recent_tools FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- webhook_events
DROP POLICY IF EXISTS "Service role full access on webhook_events" ON public.webhook_events;
CREATE POLICY "Service role full access on webhook_events" ON public.webhook_events FOR ALL TO public USING (auth.role() = 'service_role'::text);

-- user_allowed_ips
DROP POLICY IF EXISTS "Users can read own ips" ON public.user_allowed_ips;
DROP POLICY IF EXISTS "Service role full access on user_allowed_ips" ON public.user_allowed_ips;
DROP POLICY IF EXISTS "Admins can manage all ips" ON public.user_allowed_ips;

CREATE POLICY "Users can read own ips" ON public.user_allowed_ips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on user_allowed_ips" ON public.user_allowed_ips FOR ALL TO public USING (auth.role() = 'service_role'::text);
CREATE POLICY "Admins can manage all ips" ON public.user_allowed_ips FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
