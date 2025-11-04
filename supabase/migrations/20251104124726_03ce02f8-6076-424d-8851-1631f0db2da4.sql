-- Create bundles table for reusable items (sides, drinks, sauces, extras)
CREATE TABLE public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('side', 'drink', 'sauce', 'extra', 'dessert')),
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Anyone can view available bundles"
ON public.bundles FOR SELECT
USING (is_available = true);

CREATE POLICY "Restaurant owners can view their bundles"
ON public.bundles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = bundles.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "Restaurant owners can manage their bundles"
ON public.bundles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = bundles.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins have full access to bundles"
ON public.bundles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add bundle_id to menu_item_options for reusability
ALTER TABLE public.menu_item_options
ADD COLUMN bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_bundles_updated_at
BEFORE UPDATE ON public.bundles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for performance
CREATE INDEX idx_bundles_restaurant_id ON public.bundles(restaurant_id);
CREATE INDEX idx_bundles_category ON public.bundles(category);
CREATE INDEX idx_menu_item_options_bundle_id ON public.menu_item_options(bundle_id);

-- Add business hours to restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "09:00", "close": "22:00"}, "saturday": {"open": "09:00", "close": "22:00"}, "sunday": {"open": "09:00", "close": "22:00"}}'::jsonb;

-- Add city to restaurants and profiles for Congo locations
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS city TEXT CHECK (city IN ('Brazzaville', 'Pointe-Noire'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city TEXT CHECK (city IN ('Brazzaville', 'Pointe-Noire'));