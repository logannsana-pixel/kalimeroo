DROP POLICY IF EXISTS "Signed-in users can view affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Affiliates can view affiliate settings" ON public.affiliate_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Signed-in users can view driver reviews" ON public.driver_reviews;
CREATE POLICY "Authors and drivers can view driver reviews" ON public.driver_reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "Signed-in users can view neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "Signed-in users can add neighborhoods" ON public.neighborhoods;

CREATE OR REPLACE FUNCTION public.record_neighborhood(p_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text := lower(trim(p_name));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v IS NULL OR length(v) < 1 OR length(v) > 100 THEN RETURN; END IF;
  UPDATE public.neighborhoods SET usage_count = coalesce(usage_count,1)+1, updated_at = now() WHERE name = v;
  IF NOT FOUND THEN INSERT INTO public.neighborhoods(name) VALUES (v); END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_neighborhood(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_neighborhood(text) TO authenticated;