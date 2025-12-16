-- Phase 5: Marketing tables

-- Marketing banners for homepage
CREATE TABLE public.marketing_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'En savoir plus',
  background_color TEXT DEFAULT '#FF8A00',
  text_color TEXT DEFAULT '#FFFFFF',
  position TEXT DEFAULT 'top' CHECK (position IN ('top', 'middle', 'bottom')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'returning_users')),
  click_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Marketing popups
CREATE TABLE public.marketing_popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  button_text TEXT DEFAULT 'OK',
  button_url TEXT,
  popup_type TEXT DEFAULT 'info' CHECK (popup_type IN ('info', 'promo', 'announcement', 'welcome')),
  trigger_type TEXT DEFAULT 'page_load' CHECK (trigger_type IN ('page_load', 'exit_intent', 'scroll', 'time_delay')),
  trigger_value INTEGER DEFAULT 0,
  display_frequency TEXT DEFAULT 'once' CHECK (display_frequency IN ('once', 'once_per_session', 'always')),
  target_pages TEXT[] DEFAULT ARRAY['home'],
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  display_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Marketing campaigns
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'general' CHECK (campaign_type IN ('general', 'seasonal', 'flash_sale', 'new_restaurant', 'referral')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  target_metrics JSONB DEFAULT '{}',
  actual_metrics JSONB DEFAULT '{}',
  banner_ids UUID[],
  popup_ids UUID[],
  promo_code_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add sponsored fields to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsored_position INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.marketing_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_banners
CREATE POLICY "Anyone can view active banners" ON public.marketing_banners
FOR SELECT USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage banners" ON public.marketing_banners
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for marketing_popups
CREATE POLICY "Anyone can view active popups" ON public.marketing_popups
FOR SELECT USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage popups" ON public.marketing_popups
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for marketing_campaigns
CREATE POLICY "Admins can manage campaigns" ON public.marketing_campaigns
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default platform settings for super-app config
INSERT INTO public.platform_settings (key, value, category, description) VALUES
('commission_rate', '15', 'financial', 'Taux de commission plateforme (%)'),
('min_order_amount', '5000', 'orders', 'Montant minimum de commande (FCFA)'),
('delivery_base_fee', '1500', 'delivery', 'Frais de livraison de base (FCFA)'),
('delivery_per_km', '200', 'delivery', 'Frais par km supplémentaire (FCFA)'),
('driver_earnings_percent', '70', 'financial', 'Part du livreur sur les frais (%)'),
('min_driver_earning', '1500', 'financial', 'Gain minimum livreur (FCFA)'),
('app_name', '"KALIMERO"', 'general', 'Nom de l''application'),
('support_phone', '"+242 06 XXX XX XX"', 'support', 'Téléphone support'),
('support_email', '"support@kalimero.cg"', 'support', 'Email support'),
('maintenance_mode', 'false', 'system', 'Mode maintenance activé'),
('new_user_promo', 'true', 'marketing', 'Promo nouveaux utilisateurs active')
ON CONFLICT (key) DO NOTHING;