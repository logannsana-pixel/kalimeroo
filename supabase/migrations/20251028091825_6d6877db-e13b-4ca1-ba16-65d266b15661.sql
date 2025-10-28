-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for restaurant images
CREATE POLICY "Restaurant images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant owners can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can update their images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'restaurant-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'restaurant-images' AND
  auth.uid() IS NOT NULL
);

-- Storage policies for menu images
CREATE POLICY "Menu images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' AND
  auth.uid() IS NOT NULL
);

-- Add district column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS district TEXT;

-- Update handle_new_user function to create restaurant automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the role from metadata, default to 'customer' if not provided
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role);
  
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone, address, district)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'district'
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
      cuisine_type,
      description,
      image_url
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'restaurant_name',
      NEW.raw_user_meta_data->>'restaurant_address',
      NEW.raw_user_meta_data->>'cuisine_type',
      NEW.raw_user_meta_data->>'restaurant_description',
      NEW.raw_user_meta_data->>'restaurant_image_url'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add INSERT policy for menu_items
DROP POLICY IF EXISTS "Restaurant owners can add their menu items" ON public.menu_items;
CREATE POLICY "Restaurant owners can add their menu items"
ON public.menu_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Add INSERT policy for orders
DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;
CREATE POLICY "Customers can insert orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for order_items
DROP POLICY IF EXISTS "Customers can add order items" ON public.order_items;
CREATE POLICY "Customers can add order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);

-- Add INSERT policy for restaurants (for admin)
DROP POLICY IF EXISTS "Admins can create restaurants" ON public.restaurants;
CREATE POLICY "Admins can create restaurants"
ON public.restaurants FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));