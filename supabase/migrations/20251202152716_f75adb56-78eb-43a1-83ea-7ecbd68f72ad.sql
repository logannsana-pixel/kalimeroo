-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create a secure view for restaurant owners to see orders with masked customer data
CREATE OR REPLACE VIEW public.restaurant_orders_masked AS
SELECT 
  o.id,
  o.user_id,
  o.restaurant_id,
  o.delivery_driver_id,
  o.status,
  o.subtotal,
  o.delivery_fee,
  o.discount_amount,
  o.total,
  o.created_at,
  o.updated_at,
  o.promo_code_id,
  o.notes,
  -- Mask the delivery address (show only district/city)
  CASE 
    WHEN o.delivery_address LIKE '%-%' THEN split_part(o.delivery_address, '-', 1) || ' - ***'
    ELSE '***'
  END as delivery_address,
  -- Mask phone number (show only last 4 digits)
  '****' || RIGHT(o.phone, 4) as phone
FROM public.orders o;

-- Create a secure view for public reviews without user identification
CREATE OR REPLACE VIEW public.anonymous_reviews AS
SELECT 
  r.id,
  r.restaurant_id,
  r.rating,
  r.comment,
  r.created_at,
  r.updated_at,
  -- Don't expose user_id or order_id publicly
  NULL::uuid as user_id,
  NULL::uuid as order_id
FROM public.reviews r;