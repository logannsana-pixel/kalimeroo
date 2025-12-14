-- AFFILIATE SYSTEM TABLES

-- Affiliate profiles table
CREATE TABLE public.affiliates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    referral_code text NOT NULL UNIQUE,
    referral_link text,
    total_referrals integer DEFAULT 0,
    eligible_referrals integer DEFAULT 0,
    total_earnings numeric DEFAULT 0,
    available_balance numeric DEFAULT 0,
    pending_balance numeric DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
    is_eligible boolean DEFAULT false,
    ban_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Referrals tracking table
CREATE TABLE public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    referred_user_id uuid NOT NULL UNIQUE,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'eligible', 'not_eligible', 'rewarded')),
    orders_count integer DEFAULT 0,
    reward_amount numeric DEFAULT 0,
    rewarded_at timestamp with time zone,
    ip_address text,
    device_fingerprint text,
    user_agent text,
    country text,
    city text,
    is_suspicious boolean DEFAULT false,
    fraud_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Affiliate withdrawals table
CREATE TABLE public.affiliate_withdrawals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    payment_method text DEFAULT 'mobile_money',
    mobile_money_number text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected', 'paid')),
    rejection_reason text,
    processed_at timestamp with time zone,
    processed_by uuid,
    fraud_check_passed boolean,
    fraud_check_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Fraud logs table
CREATE TABLE public.affiliate_fraud_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
    referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
    withdrawal_id uuid REFERENCES public.affiliate_withdrawals(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN ('duplicate_ip', 'duplicate_device', 'duplicate_user_agent', 'vpn_detected', 'proxy_detected', 'multiple_attempts', 'suspicious_activity', 'banned_user')),
    severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address text,
    device_fingerprint text,
    user_agent text,
    details jsonb,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Affiliate settings table (admin configurable)
CREATE TABLE public.affiliate_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text NOT NULL UNIQUE,
    setting_value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);

-- Insert default affiliate settings
INSERT INTO public.affiliate_settings (setting_key, setting_value, description) VALUES
('reward_amount', '1000', 'Montant de récompense en FCFA'),
('min_orders_required', '3', 'Nombre minimum de commandes pour éligibilité'),
('min_withdrawal_amount', '5000', 'Montant minimum de retrait en FCFA'),
('withdrawal_delay_hours', '48', 'Délai de traitement des retraits en heures'),
('program_enabled', 'true', 'Programme d''affiliation activé'),
('legal_message', '"En participant au programme d''affiliation, vous acceptez nos conditions. Les gains sont annulés en cas de fraude détectée."', 'Message légal affiché aux utilisateurs');

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_fraud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Users can view their own affiliate profile"
ON public.affiliates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate profile"
ON public.affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to affiliates"
ON public.affiliates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referrals
CREATE POLICY "Affiliates can view their referrals"
ON public.referrals FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE affiliates.id = referrals.referrer_id 
    AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins have full access to referrals"
ON public.referrals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for withdrawals
CREATE POLICY "Affiliates can view their withdrawals"
ON public.affiliate_withdrawals FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE affiliates.id = affiliate_withdrawals.affiliate_id 
    AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Affiliates can create withdrawal requests"
ON public.affiliate_withdrawals FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.affiliates 
    WHERE affiliates.id = affiliate_withdrawals.affiliate_id 
    AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins have full access to withdrawals"
ON public.affiliate_withdrawals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for fraud logs
CREATE POLICY "Admins can manage fraud logs"
ON public.affiliate_fraud_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for settings
CREATE POLICY "Anyone can view affiliate settings"
ON public.affiliate_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage affiliate settings"
ON public.affiliate_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code text;
    exists_count integer;
BEGIN
    LOOP
        code := 'KAL' || upper(substr(md5(random()::text), 1, 6));
        SELECT COUNT(*) INTO exists_count FROM public.affiliates WHERE referral_code = code;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN code;
END;
$$;

-- Trigger to update affiliate stats when referral status changes
CREATE OR REPLACE FUNCTION public.update_affiliate_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.affiliates
    SET 
        total_referrals = (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = NEW.referrer_id),
        eligible_referrals = (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = NEW.referrer_id AND status = 'rewarded'),
        updated_at = now()
    WHERE id = NEW.referrer_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_update
AFTER INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_affiliate_stats();