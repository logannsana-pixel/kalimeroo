import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import burgerImg from "@/assets/burger.jpg";
import sushiImg from "@/assets/sushi.jpg";
import pastaImg from "@/assets/pasta.jpg";
import pizzaImg from "@/assets/pizza.jpg";

interface Category {
  name: string;
  count: number;
}

const categoryImages: Record<string, string> = {
  "Africaine": burgerImg,
  "Pizza": pizzaImg,
  "Fast Food": burgerImg,
  "Chinoise": sushiImg,
  "Indienne": pastaImg,
  "Italienne": pastaImg,
};

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("cuisine_type")
        .eq("is_active", true);

      if (!error && data) {
        const categoryCounts = data.reduce((acc: Record<string, number>, curr) => {
          const type = curr.cuisine_type || "Autre";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const categoriesArray = Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count,
        }));

        setCategories(categoriesArray);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Catégories populaires</h2>
            <p className="text-xl text-muted-foreground">
              Trouvez votre cuisine préférée
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Catégories populaires</h2>
          <p className="text-xl text-muted-foreground">
            Bientôt disponible 🍴
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Catégories populaires</h2>
          <p className="text-xl text-muted-foreground">
            Trouvez votre cuisine préférée
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Card 
              key={category.name}
              className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={categoryImages[category.name] || burgerImg}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count} restaurant{category.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
