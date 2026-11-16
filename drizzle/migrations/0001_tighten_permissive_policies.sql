DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Insert own or anonymous analytics events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view settings" ON public.platform_settings;

DROP POLICY IF EXISTS "Anyone can view affiliate settings" ON public.affiliate_settings;
CREATE POLICY "Signed-in users can view affiliate settings" ON public.affiliate_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
CREATE POLICY "Reviews of active restaurants are visible" ON public.reviews FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id AND r.deleted_at IS NULL) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all driver reviews" ON public.driver_reviews;
CREATE POLICY "Signed-in users can view driver reviews" ON public.driver_reviews FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public checkout options" ON public.restaurant_checkout_settings;
CREATE POLICY "Checkout options of active restaurants" ON public.restaurant_checkout_settings FOR SELECT USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_checkout_settings.restaurant_id AND r.deleted_at IS NULL AND (r.is_active = true OR r.owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can add neighborhoods" ON public.neighborhoods;
DROP POLICY IF EXISTS "Anyone can view neighborhoods" ON public.neighborhoods;
CREATE POLICY "Signed-in users can add neighborhoods" ON public.neighborhoods FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND length(trim(name)) BETWEEN 1 AND 100);
CREATE POLICY "Signed-in users can view neighborhoods" ON public.neighborhoods FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Restaurant owners can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete menu images" ON storage.objects;
CREATE POLICY "Restaurant owners can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurant-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Restaurant owners can update their images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'restaurant-images' AND owner_id = (select auth.uid()::text)) WITH CHECK (bucket_id = 'restaurant-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Restaurant owners can delete their images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'restaurant-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Restaurant owners can upload menu images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Restaurant owners can update menu images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'menu-images' AND owner_id = (select auth.uid()::text)) WITH CHECK (bucket_id = 'menu-images' AND owner_id = (select auth.uid()::text));
CREATE POLICY "Restaurant owners can delete menu images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'menu-images' AND owner_id = (select auth.uid()::text));