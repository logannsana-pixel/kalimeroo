import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/contexts/LocationContext";

interface CategoryConfig {
  icon: string;
}

const categoryData: Record<string, CategoryConfig> = {
  "Burger": { icon: "🍔" },
  "Fast Food": { icon: "🍟" },
  "Pizza": { icon: "🍕" },
  "Sandwich": { icon: "🥪" },
  "Tacos": { icon: "🌮" },
  "Kebab": { icon: "🥙" },
  "Hot-Dog": { icon: "🌭" },
  "Africaine": { icon: "🍲" },
  "Congolaise": { icon: "🥘" },
  "Sénégalaise": { icon: "🍛" },
  "Camerounaise": { icon: "🫕" },
  "Ivoirienne": { icon: "🥗" },
  "Marocaine": { icon: "🫖" },
  "Éthiopienne": { icon: "🥙" },
  "Chinoise": { icon: "🥡" },
  "Japonaise": { icon: "🍣" },
  "Coréenne": { icon: "🍜" },
  "Thaïlandaise": { icon: "🍲" },
  "Vietnamienne": { icon: "🍜" },
  "Indienne": { icon: "🍛" },
  "Asiatique": { icon: "🥢" },
  "Française": { icon: "🥐" },
  "Italienne": { icon: "🍝" },
  "Espagnole": { icon: "🥘" },
  "Grecque": { icon: "🥗" },
  "Libanaise": { icon: "🧆" },
  "Turque": { icon: "🍢" },
  "Américaine": { icon: "🥩" },
  "Mexicaine": { icon: "🌯" },
  "Brésilienne": { icon: "🍖" },
  "Poulet": { icon: "🍗" },
  "Grillades": { icon: "🥩" },
  "Poisson": { icon: "🐟" },
  "Fruits de mer": { icon: "🦐" },
  "Végétarien": { icon: "🥬" },
  "Vegan": { icon: "🌱" },
  "Healthy": { icon: "🥗" },
  "Bio": { icon: "🌿" },
  "Desserts": { icon: "🍰" },
  "Pâtisserie": { icon: "🧁" },
  "Glaces": { icon: "🍦" },
  "Café": { icon: "☕" },
  "Jus & Smoothies": { icon: "🧃" },
  "Boulangerie": { icon: "🥖" },
  "Sushi": { icon: "🍱" },
  "Ramen": { icon: "🍜" },
  "Curry": { icon: "🍛" },
  "Brunch": { icon: "🥞" },
  "Petit-déjeuner": { icon: "🍳" },
};

export const FoodCategories = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAddress = district && city;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("cuisine_type")
        .eq("is_active", true);

      if (data) {
        const uniqueCategories = [...new Set(
          data
            .map((r) => r.cuisine_type)
            .filter((c): c is string => Boolean(c))
        )];
        
        const sortedCategories = uniqueCategories.sort((a, b) => {
          const hasA = categoryData[a] ? 0 : 1;
          const hasB = categoryData[b] ? 0 : 1;
          if (hasA !== hasB) return hasA - hasB;
          return a.localeCompare(b);
        });
        
        setCategories(sortedCategories.slice(0, 10));
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const handleClick = (category: string) => {
    if (!hasAddress) {
      openModal();
      return;
    }
    navigate(`/restaurants?category=${encodeURIComponent(category)}`);
  };

  if (loading) {
    return (
      <section className="px-4 py-4">
        <Skeleton className="h-5 w-24 mb-4 bg-secondary" />
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[64px]">
              <Skeleton className="w-14 h-14 rounded-full bg-secondary" />
              <Skeleton className="w-12 h-3 bg-secondary" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-base font-bold mb-4 text-foreground">Catégories</h2>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {/* All Category */}
        <button
          onClick={() => hasAddress ? navigate("/restaurants") : openModal()}
          className="flex flex-col items-center gap-2 min-w-[64px] transition-all hover:scale-105 active:scale-95"
        >
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-xl shadow-glow">
            🍽️
          </div>
          <span className="text-xs font-semibold text-primary">Tout</span>
        </button>

        {categories.map((category) => {
          const config = categoryData[category] || { icon: "🍽️" };

          return (
            <button
              key={category}
              data-testid="food-category"
              onClick={() => handleClick(category)}
              className={`flex flex-col items-center gap-2 min-w-[64px] transition-all ${
                !hasAddress ? "opacity-50" : "hover:scale-105 active:scale-95"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl hover:bg-secondary/80 transition-colors">
                {config.icon}
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center line-clamp-1 w-14">
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
