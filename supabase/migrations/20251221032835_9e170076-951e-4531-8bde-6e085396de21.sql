-- Créer enum pour le statut des articles
CREATE TYPE public.blog_article_status AS ENUM ('draft', 'published', 'scheduled');

-- Créer enum pour les langues
CREATE TYPE public.blog_language AS ENUM ('fr', 'en');

-- Créer enum pour les rôles blog
CREATE TYPE public.blog_role AS ENUM ('admin', 'editor', 'viewer');

-- Table des catégories de blog
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  language blog_language NOT NULL DEFAULT 'fr',
  parent_category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  meta_title TEXT,
  meta_description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des articles de blog
CREATE TABLE public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  language blog_language NOT NULL DEFAULT 'fr',
  parent_article_id UUID REFERENCES public.blog_articles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  canonical_url TEXT,
  is_indexed BOOLEAN DEFAULT true,
  status blog_article_status DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  reading_time_minutes INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(slug, language)
);

-- Table des permissions blog
CREATE TABLE public.blog_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role blog_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX idx_blog_articles_language ON public.blog_articles(language);
CREATE INDEX idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX idx_blog_articles_category ON public.blog_articles(category_id);
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX idx_blog_categories_language ON public.blog_categories(language);

-- Activer RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_permissions ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier le rôle blog
CREATE OR REPLACE FUNCTION public.has_blog_role(_user_id UUID, _role blog_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blog_permissions
    WHERE user_id = _user_id
      AND (role = _role OR role = 'admin')
  )
$$;

-- Politique: Tout le monde peut lire les catégories actives
CREATE POLICY "Anyone can view active categories"
ON public.blog_categories
FOR SELECT
USING (is_active = true);

-- Politique: Admins peuvent tout faire sur les catégories
CREATE POLICY "Blog admins can manage categories"
ON public.blog_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'admin'::blog_role));

-- Politique: Tout le monde peut lire les articles publiés
CREATE POLICY "Anyone can view published articles"
ON public.blog_articles
FOR SELECT
USING (status = 'published' AND published_at <= now());

-- Politique: Editors peuvent voir tous les articles
CREATE POLICY "Editors can view all articles"
ON public.blog_articles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'editor'::blog_role) OR has_blog_role(auth.uid(), 'admin'::blog_role));

-- Politique: Editors peuvent créer des articles
CREATE POLICY "Editors can create articles"
ON public.blog_articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'editor'::blog_role) OR has_blog_role(auth.uid(), 'admin'::blog_role));

-- Politique: Editors peuvent modifier des articles
CREATE POLICY "Editors can update articles"
ON public.blog_articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'editor'::blog_role) OR has_blog_role(auth.uid(), 'admin'::blog_role));

-- Politique: Admins peuvent supprimer des articles
CREATE POLICY "Admins can delete articles"
ON public.blog_articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'admin'::blog_role));

-- Politique: Admins peuvent gérer les permissions
CREATE POLICY "Admins can manage blog permissions"
ON public.blog_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique: Users peuvent voir leurs propres permissions
CREATE POLICY "Users can view own permissions"
ON public.blog_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_blog_permissions_updated_at
  BEFORE UPDATE ON public.blog_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour auto-publier les articles programmés
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_articles 
  SET status = 'published',
      published_at = scheduled_at
  WHERE status = 'scheduled' 
    AND scheduled_at <= now();
END;
$$;

-- Créer le bucket pour les images blog
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique storage pour les images blog
CREATE POLICY "Anyone can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Editors can upload blog images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'editor'::blog_role) OR has_blog_role(auth.uid(), 'admin'::blog_role)));

CREATE POLICY "Editors can update blog images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'blog-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'editor'::blog_role) OR has_blog_role(auth.uid(), 'admin'::blog_role)));

CREATE POLICY "Admins can delete blog images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'blog-images' AND (has_role(auth.uid(), 'admin'::app_role) OR has_blog_role(auth.uid(), 'admin'::blog_role)));