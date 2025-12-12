-- Admin permissions system
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_manage_restaurants BOOLEAN DEFAULT true,
  can_manage_drivers BOOLEAN DEFAULT true,
  can_manage_orders BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT true,
  can_manage_payments BOOLEAN DEFAULT true,
  can_manage_settings BOOLEAN DEFAULT true,
  can_manage_marketing BOOLEAN DEFAULT true,
  can_manage_support BOOLEAN DEFAULT true,
  can_manage_admins BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Restaurant validation status
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS validation_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS validation_notes TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS validated_by UUID;

-- Driver validation status  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validation_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validation_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validated_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support ticket messages
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform settings
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('commission_rate', '15', 'Platform commission rate (%)', 'finance'),
  ('delivery_fee_base', '1000', 'Base delivery fee (FCFA)', 'finance'),
  ('delivery_fee_per_km', '100', 'Delivery fee per km (FCFA)', 'finance'),
  ('min_order_amount', '2000', 'Minimum order amount (FCFA)', 'orders'),
  ('max_delivery_radius', '15', 'Max delivery radius (km)', 'delivery'),
  ('driver_payout_percentage', '80', 'Driver payout percentage', 'finance'),
  ('promo_banner_text', '"Bienvenue sur KALIMERO!"', 'Promo banner text', 'marketing'),
  ('promo_banner_enabled', 'true', 'Enable promo banner', 'marketing'),
  ('maintenance_mode', 'false', 'Maintenance mode enabled', 'system'),
  ('app_version', '"1.0.0"', 'Current app version', 'system')
ON CONFLICT (key) DO NOTHING;

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('restaurant', 'driver')),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Admin permissions policies
CREATE POLICY "Admins can manage all permissions" ON public.admin_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Ticket messages policies
CREATE POLICY "Ticket participants can view messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin')))
  );
  
CREATE POLICY "Ticket participants can send messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
  
CREATE POLICY "Admins can manage all messages" ON public.ticket_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Platform settings policies
CREATE POLICY "Anyone can view settings" ON public.platform_settings
  FOR SELECT USING (true);
  
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payouts policies
CREATE POLICY "Recipients can view own payouts" ON public.payouts
  FOR SELECT USING (recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'));
  
CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_admin_permissions_updated_at BEFORE UPDATE ON public.admin_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();