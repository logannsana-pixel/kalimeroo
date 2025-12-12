import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons: Record<string, string> = {
  "Burger": "🍔",
  "Fast Food": "🍟",
  "Pizza": "🍕",
  "Africaine": "🍲",
  "Chinoise": "🥡",
  "Indienne": "🍛",
  "Italienne": "🍝",
  "Japonaise": "🍣",
  "Desserts": "🍰",
  "Grillades": "🥩",
  "Sushi": "🍣",
  "Salade": "🥗",
  "Fruits de mer": "🦐",
};

const blobColors = [
  "bg-gradient-to-br from-orange-400 to-orange-500",
  "bg-gradient-to-br from-rose-400 to-rose-500",
  "bg-gradient-to-br from-amber-400 to-amber-500",
  "bg-gradient-to-br from-emerald-400 to-emerald-500",
  "bg-gradient-to-br from-sky-400 to-sky-500",
  "bg-gradient-to-br from-violet-400 to-violet-500",
  "bg-gradient-to-br from-pink-400 to-pink-500",
  "bg-gradient-to-br from-teal-400 to-teal-500",
];

export const BlobCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
    navigate(`/restaurants?category=${encodeURIComponent(category)}`);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-14 h-3 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category, index) => (
        <button
          key={category}
          onClick={() => handleClick(category)}
          className="flex flex-col items-center gap-2 flex-shrink-0 group animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:shadow-hover ${blobColors[index % blobColors.length]}`}
            style={{
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            }}
          >
            {categoryIcons[category] || "🍽️"}
          </div>
          <span className="text-xs md:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
            {category}
          </span>
        </button>
      ))}
    </div>
  );
};
