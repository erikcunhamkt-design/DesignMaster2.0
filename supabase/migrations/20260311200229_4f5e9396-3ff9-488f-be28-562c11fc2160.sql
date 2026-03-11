
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create license
  INSERT INTO public.licenses (user_id, email, plan, status)
  VALUES (NEW.id, NEW.email, 'monthly', 'inactive');

  -- Create welcome notification
  INSERT INTO public.notifications (title, message, created_by)
  VALUES (
    '🎨 Bem-vindo ao Design Master!',
    'Estamos muito felizes em ter você aqui! Explore nossos estúdios de criação, conecte-se com a comunidade e transforme suas ideias em designs incríveis. Qualquer dúvida, estamos por aqui. Bora criar! 🚀',
    NEW.id
  );

  RETURN NEW;
END;
$function$;
