REVOKE EXECUTE ON FUNCTION public.calculate_restaurant_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_driver_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.use_promo_code(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.earn_points(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_affiliate_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') OR current_setting('app.affiliate_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.total_referrals := 0; NEW.eligible_referrals := 0; NEW.total_earnings := 0;
    NEW.available_balance := 0; NEW.pending_balance := 0; NEW.status := 'active';
    NEW.is_eligible := true; NEW.ban_reason := NULL;
  ELSE
    NEW.user_id := OLD.user_id; NEW.referral_code := OLD.referral_code;
    NEW.total_referrals := OLD.total_referrals; NEW.eligible_referrals := OLD.eligible_referrals;
    NEW.total_earnings := OLD.total_earnings; NEW.available_balance := OLD.available_balance;
    NEW.pending_balance := OLD.pending_balance; NEW.status := OLD.status;
    NEW.is_eligible := OLD.is_eligible; NEW.ban_reason := OLD.ban_reason;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_affiliate_fields ON public.affiliates;
CREATE TRIGGER guard_affiliate_fields BEFORE INSERT OR UPDATE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.guard_affiliate_fields();

CREATE OR REPLACE FUNCTION public.request_affiliate_withdrawal(p_amount numeric, p_mobile_money_number text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_aff public.affiliates%ROWTYPE; v_min numeric := 5000; v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  SELECT * INTO v_aff FROM public.affiliates WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil affilié introuvable'; END IF;
  IF coalesce(v_aff.status,'active') <> 'active' THEN RAISE EXCEPTION 'Compte affilié inactif'; END IF;
  SELECT coalesce((setting_value #>> '{}')::numeric, 5000) INTO v_min FROM public.affiliate_settings WHERE setting_key = 'min_withdrawal_amount';
  v_min := coalesce(v_min, 5000);
  IF p_amount IS NULL OR p_amount < v_min OR p_amount > coalesce(v_aff.available_balance,0) THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  IF p_mobile_money_number IS NULL OR length(trim(p_mobile_money_number)) < 9 OR length(p_mobile_money_number) > 30 THEN RAISE EXCEPTION 'Numéro Mobile Money invalide'; END IF;
  INSERT INTO public.affiliate_withdrawals(affiliate_id, amount, payment_method, mobile_money_number, status)
  VALUES (v_aff.id, p_amount, 'mobile_money', trim(p_mobile_money_number), 'pending') RETURNING id INTO v_id;
  PERFORM set_config('app.affiliate_rpc', 'on', true);
  UPDATE public.affiliates SET available_balance = available_balance - p_amount,
    pending_balance = coalesce(pending_balance,0) + p_amount WHERE id = v_aff.id;
  PERFORM set_config('app.affiliate_rpc', 'off', true);
  RETURN v_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.request_affiliate_withdrawal(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_affiliate_withdrawal(numeric, text) TO authenticated;

DROP POLICY IF EXISTS "Menu images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;