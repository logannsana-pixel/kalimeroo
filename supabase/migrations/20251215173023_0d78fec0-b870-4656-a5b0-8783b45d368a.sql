-- Create driver reviews table for driver ratings
CREATE TABLE public.driver_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create reviews for delivered orders"
ON public.driver_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = driver_reviews.order_id 
    AND orders.user_id = auth.uid() 
    AND orders.delivery_driver_id = driver_reviews.driver_id
    AND orders.status = 'delivered'
  )
);

CREATE POLICY "Users can view all driver reviews"
ON public.driver_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can update their own reviews"
ON public.driver_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.driver_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to driver reviews"
ON public.driver_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_driver_reviews_updated_at
BEFORE UPDATE ON public.driver_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add average rating column to profiles for drivers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_rating NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS driver_reviews_count INTEGER DEFAULT 0;