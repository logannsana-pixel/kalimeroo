import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft, Globe, User } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

export default function BlogArticle() {
  const { lang = "fr", slug } = useParams<{ lang: string; slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(
    article?.meta_title || article?.title || "Article",
    article?.meta_description || article?.excerpt
  );

  useEffect(() => {
    if (slug) fetchArticle();
  }, [slug, lang]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Fetch article
      const { data: articleData, error } = await supabase
        .from("blog_articles")
        .select(`*, category:blog_categories(name, slug)`)
        .eq("slug", slug)
        .eq("language", lang)
        .eq("status", "published")
        .single();

      if (error) throw error;
      setArticle(articleData);

      // Increment view count
      await supabase
        .from("blog_articles")
        .update({ view_count: (articleData.view_count || 0) + 1 })
        .eq("id", articleData.id);

      // Fetch related articles
      if (articleData.category_id) {
        const { data: related } = await supabase
          .from("blog_articles")
          .select("id, title, slug, cover_image_url")
          .eq("category_id", articleData.category_id)
          .eq("language", lang)
          .eq("status", "published")
          .neq("id", articleData.id)
          .limit(3);
        
        setRelatedArticles(related || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = lang === "fr" ? fr : enUS;

  // Convert markdown to basic HTML
  const renderContent = (content: string) => {
    return content
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, '</p>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {lang === "fr" ? "Article non trouvé" : "Article not found"}
          </h1>
          <Link to={`/${lang}/blog`} className="text-primary hover:underline">
            {lang === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <Link 
            to={`/${lang}/blog`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>

          {/* Category & Language */}
          <div className="flex items-center gap-2 mb-4">
            {article.category && (
              <Badge variant="secondary">{article.category.name}</Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {article.language.toUpperCase()}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(article.published_at), "dd MMMM yyyy", { locale: dateLocale })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.reading_time_minutes} min
            </span>
          </div>

          {/* Cover Image */}
          {article.cover_image_url && (
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              className="w-full h-auto rounded-lg mb-8"
            />
          )}

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: renderContent(article.content || "") }}
          />

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-xl font-bold mb-4">
                {lang === "fr" ? "Articles similaires" : "Related articles"}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/${lang}/blog/${related.slug}`}
                    className="group"
                  >
                    {related.cover_image_url && (
                      <img
                        src={related.cover_image_url}
                        alt={related.title}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {related.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
