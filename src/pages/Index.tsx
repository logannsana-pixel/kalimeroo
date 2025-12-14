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
        {/* HEADER (structure moderne, couleurs conservées) */}
        <div className="px-4 pt-4 space-y-4">
          <HomeHeader />

          {/* SEARCH */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un plat ou un restaurant"
              className="w-full h-12 rounded-full bg-muted px-5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* PROMO BANNER */}
          <Card className="border-none rounded-2xl overflow-hidden bg-primary text-primary-foreground">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs opacity-90">Jusqu’à -35%</p>
                <h3 className="font-bold text-base leading-tight">Sur votre première commande</h3>
                <Button size="sm" variant="secondary" className="mt-2 rounded-full">
                  Commander
                </Button>
              </div>
              <img src="/delivery-illustration.png" alt="" className="h-20 object-contain" />
            </CardContent>
          </Card>
        </div>

        {/* SERVICES */}
        <div className="mt-6">
          <ServiceTypes />
        </div>

        {/* CATEGORIES */}
        <div className="mt-2">
          <FoodCategories />
        </div>

        {/* PICKS FOR YOU */}
        <div className="mt-6 px-4">
          <PopularDishes />
        </div>

        {/* ORDER AGAIN */}
        {hasAddress && (
          <div className="mt-6">
            <OrderAgainSection />
          </div>
        )}

        {/* RESTAURANTS */}
        <section className="px-4 mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{hasAddress ? "Restaurants populaires" : "Restaurants"}</h2>
            <Button
              variant="link"
              className="p-0 text-primary text-sm"
              onClick={() => (hasAddress ? navigate("/restaurants") : openModal())}
            >
              Voir tout <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="border-none rounded-2xl text-center py-10">
              <CardContent>
                <Truck className="mx-auto mb-3 text-primary" />
                <p className="text-sm font-semibold">{hasAddress ? "Bientôt disponible" : "Choisissez votre ville"}</p>
                {!hasAddress && (
                  <Button size="sm" className="mt-3 rounded-full" onClick={openModal}>
                    Définir ma localisation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {restaurants.map((r, i) => (
                <Card
                  key={r.id}
                  className="border-none rounded-2xl overflow-hidden shadow-soft active:scale-[0.98] transition"
                  onClick={() => (hasAddress ? navigate(`/restaurant/${r.id}`) : openModal())}
                >
                  <div className="relative h-28">
                    <LazyImage
                      src={r.image_url || "/placeholder.svg"}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                    {hasAddress && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <FavoritesButton restaurantId={r.id} />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3 space-y-1">
                    <h3 className="text-sm font-bold line-clamp-1">{r.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.cuisine_type}</p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Star className="w-3 h-3 fill-primary text-primary" />
                        {r.rating?.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {r.delivery_time || "20-30"}’
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
