import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { BlogImageUpload } from "./BlogImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { AIAssistantButtons } from "./AIAssistantButtons";
import { Loader2, Save, Eye, Wand2 } from "lucide-react";

interface BlogCategory {
  id: string;
  name: string;
  language: 'fr' | 'en';
}

interface ArticleEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: any | null;
  categories: BlogCategory[];
  onSave: () => void;
}

export function ArticleEditorModal({
  open,
  onOpenChange,
  article,
  categories,
  onSave,
}: ArticleEditorModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    language: "fr" as 'fr' | 'en',
    parent_article_id: "",
    category_id: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    cover_image_alt: "",
    meta_title: "",
    meta_description: "",
    keywords: "",
    canonical_url: "",
    is_indexed: true,
    status: "draft" as 'draft' | 'published' | 'scheduled',
    scheduled_at: "",
  });

  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || "",
        slug: article.slug || "",
        language: article.language || "fr",
        parent_article_id: article.parent_article_id || "",
        category_id: article.category_id || "",
        excerpt: article.excerpt || "",
        content: article.content || "",
        cover_image_url: article.cover_image_url || "",
        cover_image_alt: article.cover_image_alt || "",
        meta_title: article.meta_title || "",
        meta_description: article.meta_description || "",
        keywords: article.keywords || "",
        canonical_url: article.canonical_url || "",
        is_indexed: article.is_indexed ?? true,
        status: article.status || "draft",
        scheduled_at: article.scheduled_at || "",
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        language: "fr",
        parent_article_id: "",
        category_id: "",
        excerpt: "",
        content: "",
        cover_image_url: "",
        cover_image_alt: "",
        meta_title: "",
        meta_description: "",
        keywords: "",
        canonical_url: "",
        is_indexed: true,
        status: "draft",
        scheduled_at: "",
      });
    }
  }, [article]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [formData.language]);

  const fetchRelatedArticles = async () => {
    try {
      const oppositeLanguage = formData.language === "fr" ? "en" : "fr";
      const { data } = await supabase
        .from("blog_articles")
        .select("id, title, language")
        .eq("language", oppositeLanguage)
        .is("parent_article_id", null);
      
      setRelatedArticles(data || []);
    } catch (error) {
      console.error("Error fetching related articles:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, "");
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("Le titre et le slug sont requis");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        title: formData.title,
        slug: formData.slug,
        language: formData.language,
        parent_article_id: formData.parent_article_id || null,
        category_id: formData.category_id || null,
        author_id: user.id,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        cover_image_url: formData.cover_image_url || null,
        cover_image_alt: formData.cover_image_alt || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        keywords: formData.keywords || null,
        canonical_url: formData.canonical_url || null,
        is_indexed: formData.is_indexed,
        status: formData.status,
        scheduled_at: formData.status === "scheduled" ? formData.scheduled_at : null,
        published_at: formData.status === "published" ? new Date().toISOString() : (article?.published_at || null),
        reading_time_minutes: calculateReadingTime(formData.content),
      };

      if (article?.id) {
        const { error } = await supabase
          .from("blog_articles")
          .update(articleData)
          .eq("id", article.id);

        if (error) throw error;
        toast.success("Article mis à jour");
      } else {
        const { error } = await supabase
          .from("blog_articles")
          .insert(articleData);

        if (error) throw error;
        toast.success("Article créé");
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving article:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.language === formData.language
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? "Modifier l'article" : "Nouvel article"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="media">Médias</TabsTrigger>
            <TabsTrigger value="publish">Publication</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titre de l'article"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug SEO *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="mon-article-seo"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Langue *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'fr' | 'en') => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Article parent (FR ↔ EN)</Label>
                <Select
                  value={formData.parent_article_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, parent_article_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lier à..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {relatedArticles.map((art) => (
                      <SelectItem key={art.id} value={art.id}>
                        {art.title} ({art.language.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Résumé / Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Résumé court de l'article..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenu</Label>
                <AIAssistantButtons
                  content={formData.content}
                  title={formData.title}
                  language={formData.language}
                  onContentUpdate={(content) => setFormData({ ...formData, content })}
                  onTitleUpdate={(title) => setFormData({ ...formData, title })}
                  onMetaUpdate={(meta) => setFormData({ ...formData, ...meta })}
                />
              </div>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Titre SEO (max 60 caractères)"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_title.length}/60 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Description SEO (max 160 caractères)"
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_description.length}/160 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Mots-clés (optionnel)</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="mot-clé1, mot-clé2, mot-clé3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonical_url">URL Canonique</Label>
              <Input
                id="canonical_url"
                value={formData.canonical_url}
                onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Indexer par les moteurs de recherche</Label>
                <p className="text-xs text-muted-foreground">
                  Désactivez pour empêcher l'indexation (noindex)
                </p>
              </div>
              <Switch
                checked={formData.is_indexed}
                onCheckedChange={(checked) => setFormData({ ...formData, is_indexed: checked })}
              />
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Image de couverture (OG + Blog)</Label>
              <BlogImageUpload
                value={formData.cover_image_url}
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                bucket="blog-images"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image_alt">Texte ALT de l'image</Label>
              <Input
                id="cover_image_alt"
                value={formData.cover_image_alt}
                onChange={(e) => setFormData({ ...formData, cover_image_alt: e.target.value })}
                placeholder="Description de l'image pour l'accessibilité"
              />
            </div>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'published' | 'scheduled') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === "scheduled" && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Date et heure de publication</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
            )}

            {article && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Créé le:</strong> {new Date(article.created_at).toLocaleDateString('fr-FR')}
                </p>
                {article.published_at && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Publié le:</strong> {new Date(article.published_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  <strong>Vues:</strong> {article.view_count || 0}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {article ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
