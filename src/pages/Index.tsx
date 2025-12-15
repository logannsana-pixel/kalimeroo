import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { LocationModal } from "@/components/LocationModal";
import { HomeHeader } from "@/components/HomeHeader";
import { ServiceTypes } from "@/components/ServiceTypes";
import { FoodCategories } from "@/components/FoodCategories";
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

      if (city) query = query.eq("city", city);

      const { data } = await query;
      if (data) setRestaurants(data);
      setLoading(false);
    };

    fetchData();
  }, [city]);

  return (
    <>
      <LocationModal />

      <main className="min-h-screen bg-background pb-24">
        {/* HEADER */}
        <div className="px-4 pt-4 space-y-5">
          <HomeHeader />
        </div>

        {/* PROMO BANNER */}
        <div className="mt-6">
          <ServiceTypes />
        </div>

        {/* CATEGORIES */}
        <div className="mt-2">
          <FoodCategories />
        </div>

        {/* ORDER AGAIN */}
        <section className="px-4 mt-4">
          {hasAddress && (
            <OrderAgainSection />
          )}
        </section>

        {/* RESTAURANTS - Picks For You */}
        <section className="px-4 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground">{hasAddress ? "Picks For You" : "Restaurants"}</h2>
            <Button
              variant="link"
              className="p-0 text-primary text-sm font-medium"
              onClick={() => (hasAddress ? navigate("/restaurants") : openModal())}
            >
              Voir tout <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="border border-border/50 rounded-2xl text-center py-10 bg-card">
              <CardContent>
                <Truck className="mx-auto mb-3 text-primary h-8 w-8" />
                <p className="text-sm font-semibold text-foreground">{hasAddress ? "Bientôt disponible" : "Choisissez votre ville"}</p>
                {!hasAddress && (
                  <Button size="sm" className="mt-3 rounded-full" onClick={openModal}>
                    Définir ma localisation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {restaurants.map((r) => (
                <Card
                  key={r.id}
                  className="group border-none rounded-2xl overflow-hidden bg-card hover:bg-card/80 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  onClick={() => (hasAddress ? navigate(`/restaurant/${r.id}`) : openModal())}
                >
                  <div className="relative h-32">
                    <LazyImage
                      src={r.image_url || "/placeholder.svg"}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Online indicator */}
                    <div className="absolute top-3 left-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-pulse" />
                    </div>
                    {hasAddress && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <FavoritesButton restaurantId={r.id} />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-primary line-clamp-1">{r.name}</h3>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        {r.delivery_fee ? `${r.delivery_fee.toLocaleString()} FC` : "Gratuit"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.cuisine_type}</p>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        {r.rating?.toFixed(1) || "4.5"}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {r.delivery_time || "20-30"} min
                      </span>
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
