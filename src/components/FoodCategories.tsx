import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/contexts/LocationContext";

interface CategoryConfig {
  icon: string;
  gradient: string;
}

const categoryData: Record<string, CategoryConfig> = {
  "Burger": { icon: "🍔", gradient: "from-amber-500/20 to-orange-500/10" },
  "Fast Food": { icon: "🍟", gradient: "from-red-500/20 to-orange-500/10" },
  "Pizza": { icon: "🍕", gradient: "from-orange-500/20 to-yellow-500/10" },
  "Africaine": { icon: "🍲", gradient: "from-yellow-500/20 to-amber-500/10" },
  "Chinoise": { icon: "🥡", gradient: "from-rose-500/20 to-red-500/10" },
  "Indienne": { icon: "🍛", gradient: "from-amber-500/20 to-orange-500/10" },
  "Italienne": { icon: "🍝", gradient: "from-green-500/20 to-emerald-500/10" },
  "Japonaise": { icon: "🍣", gradient: "from-pink-500/20 to-rose-500/10" },
  "Desserts": { icon: "🍰", gradient: "from-pink-500/20 to-purple-500/10" },
  "Grillades": { icon: "🥩", gradient: "from-red-600/20 to-red-500/10" },
  "Sushi": { icon: "🍣", gradient: "from-teal-500/20 to-cyan-500/10" },
  "Salade": { icon: "🥗", gradient: "from-green-500/20 to-lime-500/10" },
  "Fruits de mer": { icon: "🦐", gradient: "from-blue-500/20 to-cyan-500/10" },
  "Poulet": { icon: "🍗", gradient: "from-amber-500/20 to-yellow-500/10" },
  "Sandwich": { icon: "🥪", gradient: "from-yellow-500/20 to-amber-500/10" },
  "Café": { icon: "☕", gradient: "from-amber-600/20 to-amber-500/10" },
  "Boissons": { icon: "🧃", gradient: "from-blue-500/20 to-sky-500/10" },
  "Petit-déjeuner": { icon: "🥐", gradient: "from-orange-400/20 to-yellow-500/10" },
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
        const uniqueCategories = [...new Set(data.map(r => r.cuisine_type).filter(Boolean))] as string[];
        setCategories(uniqueCategories.slice(0, 8));
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
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-base font-bold text-foreground mb-3">Catégories</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category, index) => {
          const config = categoryData[category] || { icon: "🍽️", gradient: "from-muted to-muted/50" };
          
          return (
            <button
              key={category}
              onClick={() => handleClick(category)}
              className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in ${
                !hasAddress ? "opacity-70" : ""
              }`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-soft`}>
                <span className="text-2xl">{config.icon}</span>
              </div>
              <span className="text-xs font-medium text-foreground/80 max-w-16 text-center line-clamp-1">
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
