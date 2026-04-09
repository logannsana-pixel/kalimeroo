
-- Loyalty Points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  total_earned integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'bronze',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage loyalty points" ON public.loyalty_points FOR ALL USING (true) WITH CHECK (true);

-- Loyalty Transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  type text NOT NULL,
  order_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert loyalty transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);

-- Earn points function (1 point per 100 FCFA)
CREATE OR REPLACE FUNCTION public.earn_points(p_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_total numeric;
  v_points integer;
  v_new_total integer;
  v_level text;
BEGIN
  SELECT user_id, total INTO v_user_id, v_total FROM orders WHERE id = p_order_id AND status = 'delivered';
  IF v_user_id IS NULL THEN RETURN 0; END IF;
  
  v_points := FLOOR(v_total / 100);
  IF v_points <= 0 THEN RETURN 0; END IF;
  
  INSERT INTO loyalty_points (user_id, points, total_earned)
  VALUES (v_user_id, v_points, v_points)
  ON CONFLICT (user_id) DO UPDATE SET
    points = loyalty_points.points + v_points,
    total_earned = loyalty_points.total_earned + v_points,
    updated_at = now();
  
  SELECT total_earned INTO v_new_total FROM loyalty_points WHERE user_id = v_user_id;
  
  v_level := CASE
    WHEN v_new_total >= 5000 THEN 'platinum'
    WHEN v_new_total >= 1500 THEN 'gold'
    WHEN v_new_total >= 500 THEN 'silver'
    ELSE 'bronze'
  END;
  
  UPDATE loyalty_points SET level = v_level WHERE user_id = v_user_id;
  
  INSERT INTO loyalty_transactions (user_id, points, type, order_id, description)
  VALUES (v_user_id, v_points, 'earn', p_order_id, 'Points gagnés sur commande');
  
  RETURN v_points;
END;
$$;

-- Atomic promo code usage
CREATE OR REPLACE FUNCTION public.use_promo_code(code_text text, user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo record;
BEGIN
  UPDATE promo_codes SET uses_count = uses_count + 1
  WHERE code = code_text
    AND is_active = true
    AND valid_from <= now()
    AND valid_until > now()
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING * INTO v_promo;
  
  IF v_promo IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Code invalide, expiré ou épuisé');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'min_order_amount', v_promo.min_order_amount
  );
END;
$$;

-- Soft delete columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
