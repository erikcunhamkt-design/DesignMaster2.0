
-- Fix 1: Prevent participant swapping in DM conversations
DROP POLICY IF EXISTS "Participants can update dm conversations" ON public.direct_conversations;
CREATE POLICY "Participants can update dm conversations" ON public.direct_conversations
FOR UPDATE TO authenticated
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2))
WITH CHECK ((participant_1 = participant_1) AND (participant_2 = participant_2));

-- Fix 2: Restrict security definer functions to prevent user probing
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    THEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.get_chat_status(_user_id uuid)
RETURNS chat_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    THEN COALESCE(
      (SELECT CASE WHEN status = 'muted' AND muted_until IS NOT NULL AND muted_until < now() THEN 'active'::chat_status ELSE status END
       FROM public.chat_user_status WHERE user_id = _user_id),
      'active'::chat_status
    )
    ELSE 'active'::chat_status
  END
$$;
