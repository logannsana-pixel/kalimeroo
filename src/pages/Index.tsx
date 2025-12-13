import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { LocationModal } from "@/components/LocationModal";
import { HomeHeader } from "@/components/HomeHeader";
import { ServiceTypes } from "@/components/ServiceTypes";
import { FoodCategories } from "@/components/FoodCategories";
import { PopularDishes } from "@/components/PopularDishes";
import { OrderAgainSection } from "@/components/OrderAgainSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Star, Clock, ArrowRight, Truck } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { FavoritesButton } from "@/components/FavoritesButton";
import { LazyImage } from "@/components/LazyImage";

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

const Index = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hasAddress = district && city;

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee, city")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(6);

      if (city) {
        query = query.eq("city", city);
      }

      const { data: restaurantsData } = await query;

      if (restaurantsData) {
        setRestaurants(restaurantsData);
      }
      setLoading(false);
    };

    fetchData();
  }, [city]);

  return (
    <>
      <LocationModal />
      <main className="min-h-screen pb-20 bg-background">
        {/* Orange Header with location */}
        <HomeHeader />

        {/* Service Types (Restaurants, Supermarchés, Boutiques) */}
        <ServiceTypes />

        {/* Food Categories */}
        <FoodCategories />

        {/* Popular Dishes */}
        <PopularDishes />

        {/* Order Again Section */}
        {hasAddress && <OrderAgainSection />}

        {/* Popular Restaurants */}
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              {hasAddress ? "Restaurants populaires" : "Restaurants"}
            </h2>
            <Button
              variant="link"
              className="text-primary p-0 h-auto text-sm font-medium"
              onClick={() => hasAddress ? navigate("/restaurants") : openModal()}
            >
              Voir tout <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="text-center py-8 border-none shadow-soft rounded-2xl">
              <CardContent className="p-0">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">
                  {hasAddress ? "Bientôt disponible" : "Définissez votre adresse"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 px-4">
                  {hasAddress 
                    ? "Nous préparons les meilleurs restaurants" 
                    : "Pour voir les restaurants disponibles"
                  }
                </p>
                {!hasAddress && (
                  <Button onClick={openModal} className="rounded-full text-sm" size="sm">
                    Choisir ma ville
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {restaurants.map((restaurant, index) => (
                <Card
                  key={restaurant.id}
                  className={`group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-200 active:scale-[0.98] animate-fade-in rounded-2xl ${
                    !hasAddress ? "opacity-75" : ""
                  }`}
                  style={{ animationDelay: `${index * 40}ms` }}
                  onClick={() => hasAddress ? navigate(`/restaurant/${restaurant.id}`) : openModal()}
                >
                  {/* Image */}
                  <div className="relative h-24 overflow-hidden">
                    <LazyImage
                      src={restaurant.image_url || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Favorite Button */}
                    {hasAddress && (
                      <div 
                        className="absolute top-2 right-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoritesButton restaurantId={restaurant.id} />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <CardContent className="p-3">
                    <h3 className="font-bold text-sm mb-0.5 line-clamp-1">{restaurant.name}</h3>
                    {restaurant.cuisine_type && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{restaurant.cuisine_type}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        <span className="font-semibold">{restaurant.rating?.toFixed(1) || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{restaurant.delivery_time || "20-30"}'</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  );
};

export default Index;
