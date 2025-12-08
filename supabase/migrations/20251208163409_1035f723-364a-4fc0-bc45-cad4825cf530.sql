-- Fix RLS policy for delivery drivers to see pickup_pending orders
DROP POLICY IF EXISTS "Delivery drivers can view available orders" ON public.orders;

CREATE POLICY "Delivery drivers can view available orders" ON public.orders
FOR SELECT
USING (
  (status = 'pickup_pending' AND delivery_driver_id IS NULL) OR 
  (delivery_driver_id = auth.uid())
);

-- Also allow drivers to update orders with pickup_pending status when accepting
DROP POLICY IF EXISTS "Delivery drivers can update their deliveries" ON public.orders;

CREATE POLICY "Delivery drivers can update orders" ON public.orders
FOR UPDATE
USING (
  (status = 'pickup_pending' AND delivery_driver_id IS NULL) OR 
  (delivery_driver_id = auth.uid())
)
WITH CHECK (
  delivery_driver_id = auth.uid()
);