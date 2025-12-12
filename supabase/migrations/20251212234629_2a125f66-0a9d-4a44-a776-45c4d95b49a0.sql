-- Create transactions ledger table for complete financial tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order_payment', 'delivery_earning', 'restaurant_earning', 'driver_withdrawal', 'driver_cash_deposit', 'restaurant_payout', 'refund', 'platform_commission')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('driver', 'restaurant', 'customer', 'platform')),
  entity_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES public.payouts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC DEFAULT 0,
  balance_after NUMERIC DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create payment_settings table for entity-specific payment preferences
CREATE TABLE public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('driver', 'restaurant')),
  entity_id UUID NOT NULL,
  payment_method TEXT DEFAULT 'mobile_money' CHECK (payment_method IN ('mobile_money', 'bank', 'cash')),
  payment_frequency TEXT DEFAULT 'weekly' CHECK (payment_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  custom_frequency_days INTEGER,
  mobile_money_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  is_auto_payout BOOLEAN DEFAULT false,
  min_payout_amount NUMERIC DEFAULT 5000,
  next_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Create payment_reminders table
CREATE TABLE public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id UUID REFERENCES public.payouts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'overdue')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to payouts table for enhanced tracking
ALTER TABLE public.payouts 
  ADD COLUMN IF NOT EXISTS payout_type TEXT DEFAULT 'withdrawal' CHECK (payout_type IN ('withdrawal', 'cash_deposit', 'earnings_payout', 'refund', 'batch_payout')),
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Enable RLS on new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Admins can manage all transactions"
ON public.transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (entity_id = auth.uid());

-- Payment settings policies  
CREATE POLICY "Admins can manage all payment settings"
ON public.payment_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view and update their own payment settings"
ON public.payment_settings FOR ALL
USING (entity_id = auth.uid());

-- Payment reminders policies
CREATE POLICY "Admins can manage all reminders"
ON public.payment_reminders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own reminders"
ON public.payment_reminders FOR SELECT
USING (entity_id = auth.uid());

-- Create function to calculate driver balance
CREATE OR REPLACE FUNCTION public.calculate_driver_balance(driver_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(
      CASE 
        WHEN transaction_type IN ('delivery_earning') THEN amount
        WHEN transaction_type IN ('driver_withdrawal', 'driver_cash_deposit') THEN -amount
        ELSE 0
      END
    )
    FROM public.transactions
    WHERE entity_id = driver_id AND entity_type = 'driver'),
    0
  )
$$;

-- Create function to calculate restaurant balance
CREATE OR REPLACE FUNCTION public.calculate_restaurant_balance(restaurant_owner_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(
      CASE 
        WHEN transaction_type = 'restaurant_earning' THEN amount
        WHEN transaction_type = 'restaurant_payout' THEN -amount
        ELSE 0
      END
    )
    FROM public.transactions
    WHERE entity_id = restaurant_owner_id AND entity_type = 'restaurant'),
    0
  )
$$;

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;