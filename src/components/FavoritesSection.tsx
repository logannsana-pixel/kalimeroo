import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowRight, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/LazyImage";

interface FavoriteRestaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number;
  cuisine_type: string | null;
  delivery_time: string | null;
}

export const FavoritesSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      const { data } = await supabase
        .from("favorites")
        .select(`
          restaurant_id,
          restaurants (
            id,
            name,
            image_url,
            rating,
            cuisine_type,
            delivery_time
          )
        `)
        .eq("user_id", user.id)
        .limit(4);

      if (data) {
        const restaurants = data
          .map((f: any) => f.restaurants)
          .filter(Boolean) as FavoriteRestaurant[];
        setFavorites(restaurants);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  if (!user || (!loading && favorites.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <section className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-32 h-40 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          <h2 className="font-semibold text-sm text-foreground">Vos favoris</h2>
        </div>
        <button
          onClick={() => navigate("/restaurants?favorites=true")}
          className="text-primary text-xs font-medium flex items-center gap-1"
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {favorites.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            className="w-32 flex-shrink-0 bg-card rounded-2xl overflow-hidden cursor-pointer hover:bg-card/80 active:scale-[0.98] transition-all"
          >
            <div className="relative h-20">
              <LazyImage
                src={restaurant.image_url || "/placeholder.svg"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 right-1.5">
                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
              </div>
            </div>
            <div className="p-2 space-y-0.5">
              <h3 className="text-xs font-semibold text-foreground line-clamp-1">
                {restaurant.name}
              </h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {restaurant.cuisine_type}
              </p>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-0.5 text-foreground">
                  <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                  {restaurant.rating?.toFixed(1) || "4.5"}
                </span>
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {restaurant.delivery_time || "25-35"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
