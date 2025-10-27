-- Add admin role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- Add availability field for delivery drivers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Restaurant owners can manage their menu items
CREATE POLICY "Restaurant owners can insert menu items"
ON public.menu_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can update their menu items"
ON public.menu_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can delete their menu items"
ON public.menu_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Restaurant owners can view all their menu items (even unavailable ones)
CREATE POLICY "Restaurant owners can view their menu items"
ON public.menu_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = menu_items.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Restaurant owners can update order status for their restaurant orders
CREATE POLICY "Restaurant owners can update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = orders.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Delivery drivers can update orders they're assigned to
CREATE POLICY "Delivery drivers can update their deliveries"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = delivery_driver_id
);

-- Delivery drivers can view available orders (preparing status)
CREATE POLICY "Delivery drivers can view available orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (status = 'preparing' AND delivery_driver_id IS NULL)
  OR delivery_driver_id = auth.uid()
);

-- Admin can do everything on all tables
CREATE POLICY "Admins have full access to profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to restaurants"
ON public.restaurants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to menu_items"
ON public.menu_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));