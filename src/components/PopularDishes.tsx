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
  price: number;
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
        .select("id, name, image_url, price, restaurant_id")
        .eq("is_available", true)
        .not("image_url", "is", null)
        .limit(8);

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
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-28 h-36 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (dishes.length === 0) return null;

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Plats populaires</h2>
        <Button
          variant="link"
          className="text-primary p-0 h-auto text-sm font-medium"
          onClick={() => hasAddress ? navigate("/restaurants") : openModal()}
        >
          Voir tout <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {dishes.map((dish, index) => (
          <button
            key={dish.id}
            onClick={() => handleClick(dish)}
            className={`flex-shrink-0 text-left transition-all duration-200 active:scale-95 animate-fade-in ${
              !hasAddress ? "opacity-70" : ""
            }`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <Card className="w-28 h-36 overflow-hidden border-none shadow-soft rounded-2xl relative">
              <LazyImage
                src={dish.image_url || "/placeholder.svg"}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-0.5">
                  {dish.name}
                </p>
                <p className="text-white/80 text-[10px] font-medium">
                  {dish.price.toLocaleString('fr-FR')} F
                </p>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
};
