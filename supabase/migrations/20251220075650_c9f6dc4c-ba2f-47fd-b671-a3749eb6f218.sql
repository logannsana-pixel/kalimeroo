-- Create neighborhoods table to store manually entered neighborhoods for future data exploitation
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for searching neighborhoods
CREATE INDEX idx_neighborhoods_name ON public.neighborhoods USING gin(to_tsvector('french', name));
CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city);

-- Enable RLS
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Anyone can read neighborhoods (for autocomplete)
CREATE POLICY "Anyone can view neighborhoods" 
ON public.neighborhoods 
FOR SELECT 
USING (true);

-- Anyone can insert neighborhoods (we track all entered values)
CREATE POLICY "Anyone can add neighborhoods" 
ON public.neighborhoods 
FOR INSERT 
WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "Admins can manage neighborhoods" 
ON public.neighborhoods 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add pause columns to restaurants table for improved pause functionality
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS pause_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pause_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Function to auto-resume paused restaurants
CREATE OR REPLACE FUNCTION public.auto_resume_restaurants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE restaurants 
  SET is_active = true, 
      pause_message = NULL, 
      pause_until = NULL,
      paused_at = NULL
  WHERE pause_until IS NOT NULL 
    AND pause_until <= now() 
    AND is_active = false;
END;
$$;