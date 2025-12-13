import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/contexts/LocationContext";

const categoryData: Record<string, { icon: string; color: string }> = {
  "Burger": { icon: "🍔", color: "from-amber-100 to-amber-50" },
  "Fast Food": { icon: "🍟", color: "from-red-100 to-red-50" },
  "Pizza": { icon: "🍕", color: "from-orange-100 to-orange-50" },
  "Africaine": { icon: "🍲", color: "from-yellow-100 to-yellow-50" },
  "Chinoise": { icon: "🥡", color: "from-rose-100 to-rose-50" },
  "Indienne": { icon: "🍛", color: "from-amber-100 to-amber-50" },
  "Italienne": { icon: "🍝", color: "from-green-100 to-green-50" },
  "Japonaise": { icon: "🍣", color: "from-pink-100 to-pink-50" },
  "Desserts": { icon: "🍰", color: "from-pink-100 to-pink-50" },
  "Grillades": { icon: "🥩", color: "from-red-100 to-red-50" },
  "Sushi": { icon: "🍣", color: "from-teal-100 to-teal-50" },
  "Salade": { icon: "🥗", color: "from-green-100 to-green-50" },
  "Fruits de mer": { icon: "🦐", color: "from-blue-100 to-blue-50" },
  "Poulet": { icon: "🍗", color: "from-amber-100 to-amber-50" },
  "Sandwich": { icon: "🥪", color: "from-yellow-100 to-yellow-50" },
  "Café": { icon: "☕", color: "from-brown-100 to-amber-50" },
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
        setCategories(uniqueCategories.slice(0, 6));
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
      <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-full aspect-square rounded-3xl" />
              <Skeleton className="w-16 h-3 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="grid grid-cols-3 gap-3">
        {categories.map((category, index) => {
          const data = categoryData[category] || { icon: "🍽️", color: "from-gray-100 to-gray-50" };
          
          return (
            <button
              key={category}
              onClick={() => handleClick(category)}
              className={`text-center transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in ${
                !hasAddress ? "opacity-70" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className={`p-4 border-none shadow-soft rounded-3xl bg-gradient-to-br ${data.color}`}>
                <div className="text-4xl">{data.icon}</div>
              </Card>
              <p className="text-xs font-medium mt-2 text-foreground line-clamp-1">
                {category}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
