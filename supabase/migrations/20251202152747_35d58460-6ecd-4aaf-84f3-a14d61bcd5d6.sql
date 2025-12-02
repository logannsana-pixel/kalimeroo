-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.restaurant_orders_masked;
DROP VIEW IF EXISTS public.anonymous_reviews;

-- Recreate with explicit SECURITY INVOKER
CREATE VIEW public.restaurant_orders_masked 
WITH (security_invoker = true)
AS
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
  CASE 
    WHEN o.delivery_address LIKE '%-%' THEN split_part(o.delivery_address, '-', 1) || ' - ***'
    ELSE '***'
  END as delivery_address,
  '****' || RIGHT(o.phone, 4) as phone
FROM public.orders o;

CREATE VIEW public.anonymous_reviews 
WITH (security_invoker = true)
AS
SELECT 
  r.id,
  r.restaurant_id,
  r.rating,
  r.comment,
  r.created_at,
  r.updated_at
FROM public.reviews r;