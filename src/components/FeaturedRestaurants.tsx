import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number;
  cuisine_type: string | null;
  delivery_time: string | null;
  delivery_fee: number;
}

export const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee")
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
      <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Restaurants populaires
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Découvrez nos meilleurs partenaires
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 md:h-80 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return (
      <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Restaurants populaires
          </h2>
          <p className="text-base md:text-xl text-muted-foreground mb-4">
            Bientôt disponible 🍴
          </p>
          <p className="text-sm md:text-base text-muted-foreground">
            Nous travaillons pour vous proposer les meilleurs restaurants
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Restaurants populaires
          </h2>
          <p className="text-base md:text-xl text-muted-foreground">
            Découvrez nos meilleurs partenaires
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {restaurants.map((restaurant, index) => (
            <Card 
              key={restaurant.id}
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 bg-gradient-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img 
                  src={restaurant.image_url || "/placeholder.svg"}
                  alt={restaurant.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {restaurant.rating > 0 && (
                  <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-background/90 text-foreground text-xs">
                    <Star className="w-3 h-3 fill-primary text-primary mr-1" />
                    {restaurant.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 md:p-4">
                <h3 className="text-base md:text-lg font-semibold mb-2 line-clamp-1">
                  {restaurant.name}
                </h3>
                {restaurant.cuisine_type && (
                  <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {restaurant.cuisine_type}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{restaurant.delivery_time || "30-45 min"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{restaurant.delivery_fee} FCFA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
