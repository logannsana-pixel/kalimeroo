import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/contexts/LocationContext";

interface CategoryConfig {
  icon: string;
}

const categoryData: Record<string, CategoryConfig> = {
  Burger: { icon: "🍔" },
  "Fast Food": { icon: "🍟" },
  Pizza: { icon: "🍕" },
  Africaine: { icon: "🍲" },
  Chinoise: { icon: "🥡" },
  Italienne: { icon: "🍝" },
  Japonaise: { icon: "🍣" },
  Desserts: { icon: "🍰" },
};

export const FoodCategories = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAddress = district && city;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("restaurants").select("cuisine_type").eq("is_active", true);

      if (data) {
        const unique = [...new Set(data.map((r) => r.cuisine_type).filter(Boolean))] as string[];
        setCategories(unique.slice(0, 8));
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
      <section className="px-4 py-4 flex gap-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-16 h-16 rounded-full" />
        ))}
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="px-4 py-4">
      <h2 className="text-sm font-semibold mb-3">Catégories</h2>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const icon = categoryData[category]?.icon || "🍽️";

          return (
            <button
              key={category}
              onClick={() => handleClick(category)}
              className={`flex flex-col items-center gap-2 min-w-[64px] ${!hasAddress ? "opacity-60" : ""}`}
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl shadow-sm">
                {icon}
              </div>
              <span className="text-xs font-medium text-center truncate w-16">{category}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
