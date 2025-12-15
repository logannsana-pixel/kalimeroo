import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/contexts/LocationContext";

interface CategoryConfig {
  icon: string;
  gradient: string;
}

// Comprehensive cuisine categories with unique icons and gradients
const categoryData: Record<string, CategoryConfig> = {
  // Fast Food & Street Food
  "Burger": { icon: "🍔", gradient: "from-amber-500 to-orange-600" },
  "Fast Food": { icon: "🍟", gradient: "from-yellow-500 to-amber-600" },
  "Pizza": { icon: "🍕", gradient: "from-red-500 to-orange-600" },
  "Sandwich": { icon: "🥪", gradient: "from-amber-400 to-yellow-500" },
  "Tacos": { icon: "🌮", gradient: "from-orange-500 to-red-600" },
  "Kebab": { icon: "🥙", gradient: "from-amber-600 to-orange-700" },
  "Hot-Dog": { icon: "🌭", gradient: "from-red-400 to-amber-500" },
  
  // African Cuisines
  "Africaine": { icon: "🍲", gradient: "from-amber-600 to-yellow-700" },
  "Congolaise": { icon: "🥘", gradient: "from-green-600 to-emerald-700" },
  "Sénégalaise": { icon: "🍛", gradient: "from-yellow-600 to-orange-700" },
  "Camerounaise": { icon: "🫕", gradient: "from-green-500 to-teal-600" },
  "Ivoirienne": { icon: "🥗", gradient: "from-orange-500 to-amber-600" },
  "Marocaine": { icon: "🫖", gradient: "from-red-600 to-orange-700" },
  "Éthiopienne": { icon: "🥙", gradient: "from-yellow-700 to-amber-800" },
  
  // Asian Cuisines
  "Chinoise": { icon: "🥡", gradient: "from-red-600 to-rose-700" },
  "Japonaise": { icon: "🍣", gradient: "from-pink-500 to-rose-600" },
  "Coréenne": { icon: "🍜", gradient: "from-red-500 to-pink-600" },
  "Thaïlandaise": { icon: "🍲", gradient: "from-green-500 to-lime-600" },
  "Vietnamienne": { icon: "🍜", gradient: "from-lime-500 to-green-600" },
  "Indienne": { icon: "🍛", gradient: "from-orange-600 to-red-700" },
  "Asiatique": { icon: "🥢", gradient: "from-red-500 to-amber-600" },
  
  // European Cuisines  
  "Française": { icon: "🥐", gradient: "from-blue-500 to-indigo-600" },
  "Italienne": { icon: "🍝", gradient: "from-green-600 to-red-600" },
  "Espagnole": { icon: "🥘", gradient: "from-red-600 to-yellow-600" },
  "Grecque": { icon: "🥗", gradient: "from-blue-600 to-cyan-600" },
  "Libanaise": { icon: "🧆", gradient: "from-green-500 to-emerald-600" },
  "Turque": { icon: "🍢", gradient: "from-red-600 to-orange-600" },
  
  // American Cuisines
  "Américaine": { icon: "🥩", gradient: "from-blue-600 to-red-600" },
  "Mexicaine": { icon: "🌯", gradient: "from-green-600 to-red-600" },
  "Brésilienne": { icon: "🍖", gradient: "from-green-500 to-yellow-500" },
  
  // Food Types
  "Poulet": { icon: "🍗", gradient: "from-amber-500 to-orange-600" },
  "Grillades": { icon: "🥩", gradient: "from-red-600 to-orange-700" },
  "Poisson": { icon: "🐟", gradient: "from-blue-500 to-cyan-600" },
  "Fruits de mer": { icon: "🦐", gradient: "from-cyan-500 to-blue-600" },
  "Végétarien": { icon: "🥬", gradient: "from-green-500 to-emerald-600" },
  "Vegan": { icon: "🌱", gradient: "from-green-600 to-lime-600" },
  "Healthy": { icon: "🥗", gradient: "from-lime-500 to-green-600" },
  "Bio": { icon: "🌿", gradient: "from-emerald-500 to-green-600" },
  
  // Desserts & Drinks
  "Desserts": { icon: "🍰", gradient: "from-pink-500 to-rose-600" },
  "Pâtisserie": { icon: "🧁", gradient: "from-pink-400 to-purple-500" },
  "Glaces": { icon: "🍦", gradient: "from-cyan-400 to-pink-500" },
  "Café": { icon: "☕", gradient: "from-amber-700 to-orange-800" },
  "Jus & Smoothies": { icon: "🧃", gradient: "from-orange-500 to-yellow-500" },
  "Boulangerie": { icon: "🥖", gradient: "from-amber-500 to-yellow-600" },
  
  // Specialty
  "Sushi": { icon: "🍱", gradient: "from-pink-500 to-red-600" },
  "Ramen": { icon: "🍜", gradient: "from-amber-600 to-orange-700" },
  "Curry": { icon: "🍛", gradient: "from-yellow-600 to-orange-700" },
  "Brunch": { icon: "🥞", gradient: "from-amber-400 to-orange-500" },
  "Petit-déjeuner": { icon: "🍳", gradient: "from-yellow-400 to-amber-500" },
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
        // Get unique categories, filter nulls, and remove duplicates
        const uniqueCategories = [...new Set(
          data
            .map((r) => r.cuisine_type)
            .filter((c): c is string => Boolean(c))
        )];
        
        // Sort by whether we have icon data, then alphabetically
        const sortedCategories = uniqueCategories.sort((a, b) => {
          const hasA = categoryData[a] ? 0 : 1;
          const hasB = categoryData[b] ? 0 : 1;
          if (hasA !== hasB) return hasA - hasB;
          return a.localeCompare(b);
        });
        
        setCategories(sortedCategories.slice(0, 12));
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
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-base font-bold mb-4 text-foreground">Catégories de cuisine</h2>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => {
          const config = categoryData[category] || { 
            icon: "🍽️", 
            gradient: "from-gray-500 to-gray-600" 
          };

          return (
            <button
              key={category}
              onClick={() => handleClick(category)}
              className={`flex flex-col items-center gap-2 min-w-[72px] transition-all duration-200 ${
                !hasAddress ? "opacity-50" : "hover:scale-105 active:scale-95"
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg shadow-black/10`}>
                {config.icon}
              </div>
              <span className="text-xs font-medium text-center text-foreground/80 line-clamp-1 w-16">
                {category}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
