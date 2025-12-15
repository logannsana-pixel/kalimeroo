
-- Create FAQ categories table
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'HelpCircle',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create FAQ items table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for FAQ categories
CREATE POLICY "Anyone can view active FAQ categories"
  ON public.faq_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQ categories"
  ON public.faq_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for FAQ items
CREATE POLICY "Anyone can view active FAQ items"
  ON public.faq_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQ items"
  ON public.faq_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add user_type to support_tickets for categorization
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'customer';

-- Insert default FAQ categories
INSERT INTO public.faq_categories (name, description, icon, display_order) VALUES
  ('Commandes', 'Questions sur les commandes et le suivi', 'ShoppingBag', 1),
  ('Livraison', 'Questions sur la livraison et les délais', 'Truck', 2),
  ('Paiements', 'Questions sur les paiements et remboursements', 'CreditCard', 3),
  ('Compte', 'Questions sur votre compte et profil', 'User', 4);

-- Insert sample FAQ items
INSERT INTO public.faq_items (category_id, question, answer, display_order)
SELECT 
  c.id,
  q.question,
  q.answer,
  q.display_order
FROM faq_categories c
CROSS JOIN (
  VALUES 
    ('Commandes', 'Comment passer une commande ?', 'Sélectionnez un restaurant, choisissez vos plats, ajoutez-les au panier puis validez votre commande.', 1),
    ('Commandes', 'Puis-je annuler ma commande ?', 'Vous pouvez annuler tant que le restaurant n''a pas commencé la préparation. Contactez le support pour assistance.', 2),
    ('Livraison', 'Combien de temps prend la livraison ?', 'Le délai varie selon le restaurant et votre localisation. Généralement entre 30 et 60 minutes.', 1),
    ('Livraison', 'Comment suivre ma commande ?', 'Allez dans Mes Commandes pour voir le statut en temps réel et la position du livreur.', 2),
    ('Paiements', 'Quels moyens de paiement acceptez-vous ?', 'Nous acceptons Mobile Money et le paiement à la livraison (Cash).', 1),
    ('Paiements', 'Comment obtenir un remboursement ?', 'Contactez notre support avec votre numéro de commande. Les remboursements sont traités sous 24-48h.', 2),
    ('Compte', 'Comment modifier mon profil ?', 'Allez dans Profil puis Paramètres pour modifier vos informations personnelles.', 1),
    ('Compte', 'J''ai oublié mon mot de passe', 'Utilisez l''option "Mot de passe oublié" sur la page de connexion pour réinitialiser.', 2)
) AS q(cat_name, question, answer, display_order)
WHERE c.name = q.cat_name;
