CREATE TABLE public.restaurant_checkout_settings (
 restaurant_id uuid PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
 allow_cod boolean NOT NULL DEFAULT true,
 allow_mobile_money boolean NOT NULL DEFAULT false,
 deposit_type text NOT NULL DEFAULT 'none' CHECK (deposit_type IN ('none','percentage','fixed')),
 deposit_value numeric NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (allow_cod OR allow_mobile_money),
 CHECK ((deposit_type='none' AND deposit_value=0) OR (allow_mobile_money AND deposit_value>0 AND (deposit_type='fixed' OR deposit_value<100)))
);
GRANT SELECT ON public.restaurant_checkout_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.restaurant_checkout_settings TO authenticated;
GRANT ALL ON public.restaurant_checkout_settings TO service_role;
ALTER TABLE public.restaurant_checkout_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public checkout options" ON public.restaurant_checkout_settings FOR SELECT USING (true);
CREATE POLICY "Owner checkout insert" ON public.restaurant_checkout_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid()));
CREATE POLICY "Owner checkout update" ON public.restaurant_checkout_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id=restaurant_id AND r.owner_id=auth.uid()));
CREATE TABLE public.order_payments (
 order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
 method text NOT NULL CHECK (method IN ('cod','mobile_money','deposit')),
 currency text NOT NULL DEFAULT 'XAF' CHECK (currency='XAF'),
 due_now integer NOT NULL CHECK (due_now>=0),
 due_on_delivery integer NOT NULL CHECK (due_on_delivery>=0),
 paid_amount integer NOT NULL DEFAULT 0 CHECK (paid_amount>=0),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled','refunded','cod')),
 session_id text UNIQUE,
 checkout_url text,
 livemode boolean,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_payments TO authenticated;
GRANT ALL ON public.order_payments TO service_role;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order participants read payments" ON public.order_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o JOIN public.restaurants r ON r.id=o.restaurant_id WHERE o.id=order_id AND (o.user_id=auth.uid() OR r.owner_id=auth.uid() OR o.delivery_driver_id=auth.uid())) OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.create_checkout_order(p_request_id uuid, p_method text, p_phone text, p_address text, p_notes text DEFAULT NULL, p_promo_id uuid DEFAULT NULL, p_pickup boolean DEFAULT false, p_voice_url text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid:=auth.uid(); v_rest uuid; v_count integer; v_sub numeric; v_fee numeric; v_discount numeric:=0; v_total integer; v_now integer:=0; v_order uuid; v_settings public.restaurant_checkout_settings%ROWTYPE; v_promo public.promo_codes%ROWTYPE;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
 SELECT id INTO v_order FROM public.orders WHERE id=p_request_id AND user_id=v_user;
 IF FOUND THEN RETURN v_order; END IF;
 IF length(trim(p_phone))<8 OR length(trim(p_phone))>30 OR length(trim(p_address))<3 OR length(p_address)>2000 OR length(coalesce(p_notes,''))>4000 THEN RAISE EXCEPTION 'Coordonnées invalides'; END IF;
 PERFORM 1 FROM public.cart_items WHERE user_id=v_user FOR UPDATE;
 SELECT count(DISTINCT m.restaurant_id), (array_agg(m.restaurant_id))[1], sum(m.price*c.quantity) INTO v_count,v_rest,v_sub FROM public.cart_items c JOIN public.menu_items m ON m.id=c.menu_item_id WHERE c.user_id=v_user;
 IF v_count<>1 OR v_sub IS NULL THEN RAISE EXCEPTION 'Le panier doit contenir un seul restaurant'; END IF;
 IF EXISTS (SELECT 1 FROM public.cart_items c JOIN public.menu_items m ON m.id=c.menu_item_id WHERE c.user_id=v_user AND (c.quantity<1 OR c.quantity>100 OR m.is_available=false)) THEN RAISE EXCEPTION 'Article indisponible'; END IF;
 SELECT CASE WHEN p_pickup THEN 0 ELSE coalesce(delivery_fee,0) END INTO v_fee FROM public.restaurants WHERE id=v_rest AND is_active=true AND deleted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Restaurant indisponible'; END IF;
 SELECT * INTO v_settings FROM public.restaurant_checkout_settings WHERE restaurant_id=v_rest;
 IF NOT FOUND THEN v_settings.allow_cod:=true; v_settings.allow_mobile_money:=false; v_settings.deposit_type:='none'; v_settings.deposit_value:=0; END IF;
 IF p_promo_id IS NOT NULL THEN
  SELECT * INTO v_promo FROM public.promo_codes WHERE id=p_promo_id FOR UPDATE;
  IF NOT FOUND OR NOT v_promo.is_active OR v_promo.valid_from>now() OR v_promo.valid_until<now() OR (v_promo.max_uses IS NOT NULL AND v_promo.uses_count>=v_promo.max_uses) OR v_sub<v_promo.min_order_amount OR (v_promo.restaurant_id IS NOT NULL AND v_promo.restaurant_id<>v_rest) THEN RAISE EXCEPTION 'Code promo invalide'; END IF;
  v_discount:=least(v_sub, CASE WHEN v_promo.discount_type='percentage' THEN v_sub*v_promo.discount_value/100 ELSE v_promo.discount_value END);
 END IF;
 v_total:=greatest(0,round(v_sub+v_fee-v_discount));
 IF p_method='cod' AND v_settings.allow_cod THEN v_now:=0;
 ELSIF p_method='mobile_money' AND v_settings.allow_mobile_money THEN v_now:=v_total;
 ELSIF p_method='deposit' AND v_settings.allow_mobile_money AND v_settings.deposit_type<>'none' AND NOT p_pickup THEN
  v_now:=least(v_total,CASE WHEN v_settings.deposit_type='percentage' THEN ceil(v_total*v_settings.deposit_value/100) ELSE ceil(v_settings.deposit_value) END);
 ELSE RAISE EXCEPTION 'Mode de paiement non autorisé'; END IF;
 IF p_method<>'cod' AND v_now<1 THEN RAISE EXCEPTION 'Montant en ligne invalide'; END IF;
 INSERT INTO public.orders(id,user_id,restaurant_id,phone,delivery_address,notes,subtotal,delivery_fee,discount_amount,total,status,promo_code_id,voice_note_url) VALUES(p_request_id,v_user,v_rest,p_phone,p_address,p_notes,v_sub,v_fee,v_discount,v_total,'pending',p_promo_id,p_voice_url);
 INSERT INTO public.order_items(order_id,menu_item_id,quantity,price,selected_options) SELECT p_request_id,c.menu_item_id,c.quantity,m.price,c.selected_options FROM public.cart_items c JOIN public.menu_items m ON m.id=c.menu_item_id WHERE c.user_id=v_user;
 INSERT INTO public.order_payments(order_id,method,due_now,due_on_delivery,status) VALUES(p_request_id,p_method,v_now,v_total-v_now,CASE WHEN p_method='cod' THEN 'cod' ELSE 'pending' END);
 IF p_promo_id IS NOT NULL THEN UPDATE public.promo_codes SET uses_count=uses_count+1 WHERE id=p_promo_id; END IF;
 DELETE FROM public.cart_items WHERE user_id=v_user;
 RETURN p_request_id;
END $$;
REVOKE ALL ON FUNCTION public.create_checkout_order(uuid,text,text,text,text,uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(uuid,text,text,text,text,uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.guard_order_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status NOT IN ('pending','cancelled') AND EXISTS(SELECT 1 FROM public.order_payments WHERE order_id=NEW.id AND due_now>0 AND status<>'paid') THEN RAISE EXCEPTION 'Paiement préalable non confirmé'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_order_payment BEFORE UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_order_payment();