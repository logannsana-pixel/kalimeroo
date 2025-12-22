import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowRight, Globe } from "lucide-react";
import { format } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type BlogLanguage = Database["public"]["Enums"]["blog_language"];

export default function BlogList() {
  const { lang: langParam = "fr" } = useParams<{ lang: string }>();
  const lang = (langParam === "en" ? "en" : "fr") as BlogLanguage;
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useDocumentTitle(
    lang === "fr" ? "Blog - Kalimero" : "Blog - Kalimero",
    lang === "fr" 
      ? "Découvrez nos articles sur la livraison, les restaurants et la gastronomie au Congo"
      : "Discover our articles about delivery, restaurants and gastronomy in Congo"
  );

  useEffect(() => {
    fetchData();
  }, [lang, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("blog_articles")
        .select(`*, category:blog_categories(name, slug)`)
        .eq("language", lang)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const [articlesRes, categoriesRes] = await Promise.all([
        query,
        supabase
          .from("blog_categories")
          .select("id, name, slug")
          .eq("language", lang)
          .eq("is_active", true)
          .order("display_order"),
      ]);

      setArticles(articlesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = lang === "fr" ? frLocale : enUS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {lang === "fr" ? "Notre Blog" : "Our Blog"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {lang === "fr" 
              ? "Découvrez nos derniers articles sur la livraison, les tendances culinaires et bien plus encore."
              : "Discover our latest articles about delivery, culinary trends and much more."}
          </p>
          
          {/* Language switcher */}
          <div className="flex justify-center gap-2 mt-4">
            <Link to="/fr/blog">
              <Badge variant={lang === "fr" ? "default" : "outline"} className="cursor-pointer">
                <Globe className="h-3 w-3 mr-1" /> FR
              </Badge>
            </Link>
            <Link to="/en/blog">
              <Badge variant={lang === "en" ? "default" : "outline"} className="cursor-pointer">
                <Globe className="h-3 w-3 mr-1" /> EN
              </Badge>
            </Link>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              {lang === "fr" ? "Tous" : "All"}
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "fr" ? "Aucun article pour le moment" : "No articles yet"}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`/${lang}/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                  {article.cover_image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={article.cover_image_url}
                        alt={article.cover_image_alt || article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    {article.category && (
                      <Badge variant="secondary" className="mb-2">
                        {article.category.name}
                      </Badge>
                    )}
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(article.published_at), "dd MMM yyyy", { locale: dateLocale })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.reading_time_minutes} min
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
