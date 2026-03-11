
-- Notifications table for admin broadcast notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Track which users have read which notifications
CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read notifications
CREATE POLICY "Authenticated can read notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Users can read own notification reads
CREATE POLICY "Users can read own reads"
  ON public.notification_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own reads (mark as read)
CREATE POLICY "Users can mark as read"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
