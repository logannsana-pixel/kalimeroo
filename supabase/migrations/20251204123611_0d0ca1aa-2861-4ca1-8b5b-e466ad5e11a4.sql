-- Add selected_options column to cart_items for storing customizations
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS selected_options jsonb DEFAULT '[]'::jsonb;