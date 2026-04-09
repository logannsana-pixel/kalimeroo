
-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can manage loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON public.loyalty_transactions;

-- Admins can manage all loyalty points
CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own loyalty points (for initial creation)
CREATE POLICY "Users can upsert own loyalty points" ON public.loyalty_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loyalty points" ON public.loyalty_points FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage loyalty transactions
CREATE POLICY "Admins can manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
