import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { LazyImage } from "@/components/LazyImage";

interface MenuItem {
  id: string;
  name: string;
  image_url: string | null;
  restaurant_id: string;
}

export const PopularDishes = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hasAddress = district && city;

  useEffect(() => {
    const fetchDishes = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, image_url, restaurant_id")
        .eq("is_available", true)
        .not("image_url", "is", null)
        .limit(6);

      if (data) {
        setDishes(data);
      }
      setLoading(false);
    };

    fetchDishes();
  }, []);

  const handleClick = (dish: MenuItem) => {
    if (!hasAddress) {
      openModal();
      return;
    }
    navigate(`/restaurant/${dish.restaurant_id}`);
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-32 h-40 rounded-3xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (dishes.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Plats populaires</h2>
        <Button
          variant="link"
          className="text-primary p-0 h-auto font-medium"
          onClick={() => hasAddress ? navigate("/restaurants") : openModal()}
        >
          Voir tout <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {dishes.map((dish, index) => (
          <button
            key={dish.id}
            onClick={() => handleClick(dish)}
            className={`flex-shrink-0 text-left transition-all duration-200 hover:scale-105 active:scale-95 animate-fade-in ${
              !hasAddress ? "opacity-70" : ""
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Card className="w-32 h-40 overflow-hidden border-none shadow-soft rounded-3xl relative">
              <LazyImage
                src={dish.image_url || "/placeholder.svg"}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
                  {dish.name}
                </p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
};
