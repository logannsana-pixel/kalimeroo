
-- Update order_status enum with complete workflow states
-- First, we need to add new values to the existing enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted' AFTER 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pickup_pending' AFTER 'preparing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pickup_accepted' AFTER 'pickup_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'pickup_accepted';

-- Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to send notification on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_id UUID;
  driver_id UUID;
  restaurant_owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get IDs
  customer_id := NEW.user_id;
  driver_id := NEW.delivery_driver_id;
  
  SELECT owner_id INTO restaurant_owner_id 
  FROM public.restaurants 
  WHERE id = NEW.restaurant_id;

  -- Set notification based on status
  CASE NEW.status
    WHEN 'pending' THEN
      notification_title := 'Commande envoyée';
      notification_message := 'En attente de confirmation du restaurant.';
    WHEN 'accepted' THEN
      notification_title := 'Commande acceptée';
      notification_message := 'Le restaurant a accepté votre commande.';
    WHEN 'preparing' THEN
      notification_title := 'En préparation';
      notification_message := 'Le restaurant prépare votre commande.';
    WHEN 'pickup_pending' THEN
      notification_title := 'Prêt pour enlèvement';
      notification_message := 'Votre commande est prête, en attente d''un livreur.';
    WHEN 'pickup_accepted' THEN
      notification_title := 'Livreur assigné';
      notification_message := 'Un livreur se dirige vers le restaurant.';
    WHEN 'picked_up' THEN
      notification_title := 'Commande récupérée';
      notification_message := 'Le livreur a récupéré votre commande.';
    WHEN 'delivering' THEN
      notification_title := 'En livraison';
      notification_message := 'Votre commande est en chemin !';
    WHEN 'delivered' THEN
      notification_title := 'Commande livrée';
      notification_message := 'Bon appétit ! 🎉';
    WHEN 'cancelled' THEN
      notification_title := 'Commande annulée';
      notification_message := 'Votre commande a été annulée.';
    ELSE
      RETURN NEW;
  END CASE;

  -- Notify customer
  IF customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, order_id, type, title, message)
    VALUES (customer_id, NEW.id, 'order_status', notification_title, notification_message);
  END IF;

  -- Notify driver for relevant statuses
  IF driver_id IS NOT NULL AND NEW.status IN ('pickup_accepted', 'picked_up', 'delivering', 'delivered') THEN
    INSERT INTO public.notifications (user_id, order_id, type, title, message)
    VALUES (driver_id, NEW.id, 'order_status', notification_title, notification_message);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_order_status_change();

-- Add typing indicator support to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false;
