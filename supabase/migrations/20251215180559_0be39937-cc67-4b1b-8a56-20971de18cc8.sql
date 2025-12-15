-- Update the handle_new_user function to store email separately
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get the role from metadata, default to 'customer' if not provided
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role);
  
  -- Create profile with separate phone and email fields
  INSERT INTO public.profiles (id, full_name, phone, email, address, district, city)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'district',
    NEW.raw_user_meta_data->>'city'
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If restaurant owner, create restaurant automatically
  IF user_role = 'restaurant_owner' THEN
    INSERT INTO public.restaurants (
      owner_id,
      name,
      address,
      city,
      cuisine_type,
      description,
      image_url
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'restaurant_name',
      NEW.raw_user_meta_data->>'restaurant_address',
      NEW.raw_user_meta_data->>'restaurant_city',
      NEW.raw_user_meta_data->>'cuisine_type',
      NEW.raw_user_meta_data->>'restaurant_description',
      NEW.raw_user_meta_data->>'restaurant_image_url'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;