CREATE POLICY "Admins can insert licenses"
ON public.licenses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));