import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/ui/restaurant-card";
import { ArrowRight } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number;
  cuisine_type: string | null;
  delivery_time: string | null;
  delivery_fee: number;
  city: string | null;
}

export const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee, city")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(4);

      if (!error && data) {
        setRestaurants(data);
      }
      setLoading(false);
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Stores you might like</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return (
      <section className="py-6">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-sm font-semibold mb-1">Restaurants populaires</h2>
          <p className="text-xs text-muted-foreground">
            Bientôt disponible
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">Stores you might like</h2>
            <span className="text-muted-foreground text-xs">✓</span>
          </div>
          <button 
            onClick={() => navigate('/restaurants')}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Restaurant Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              imageUrl={restaurant.image_url || "/placeholder.svg"}
              name={restaurant.name}
              rating={restaurant.rating ? Math.round(restaurant.rating * 10) : 88}
              reviewCount={Math.floor(Math.random() * 500) + 100}
              badge={restaurant.city || undefined}
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
