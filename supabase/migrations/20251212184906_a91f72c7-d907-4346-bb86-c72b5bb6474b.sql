-- Add location tracking columns to profiles (for drivers)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

-- Add restaurant coordinates
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (latitude, longitude) WHERE latitude IS NOT NULL;

-- Enable realtime for profiles location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;