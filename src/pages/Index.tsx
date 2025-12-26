import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { HomeHeader } from "@/components/HomeHeader";
import { FoodCategories } from "@/components/FoodCategories";
import { OrderAgainSection } from "@/components/OrderAgainSection";
import { IntentionFilters } from "@/components/IntentionFilters";
import { PersonalizedCTA } from "@/components/PersonalizedCTA";
import { FavoritesSection } from "@/components/FavoritesSection";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Star, Clock, ArrowRight, Truck } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { FavoritesButton } from "@/components/FavoritesButton";
import { LazyImage } from "@/components/LazyImage";
import { useAuth } from "@/hooks/useAuth";
import { MarketingBanner } from "@/components/marketing/MarketingBanner";
import { MarketingPopup } from "@/components/marketing/MarketingPopup";
import { SponsoredRestaurants } from "@/components/marketing/SponsoredRestaurants";
import { isRestaurantOpen, getNextOpenTime } from "@/hooks/useRestaurantAvailability";

interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number;
  cuisine_type: string | null;
  delivery_time: string | null;
  delivery_fee: number;
  city: string | null;
  isOpen?: boolean;
  nextOpenTime?: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { district, city, address, openModal } = useLocation();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAddress = !!district && !!address;
  const hasCity = !!city;
  const isConnected = !!user;

  // Open address modal if city is set but detailed address is not
  useEffect(() => {
    if (hasCity && !hasAddress) {
      openModal();
    }
  }, [hasCity, hasAddress, openModal]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee, city, business_hours")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(6);

      if (city) query = query.eq("city", city);

      const { data } = await query;
      if (data) {
        // Add availability status to each restaurant
        const restaurantsWithStatus = data.map((r: any) => ({
          ...r,
          isOpen: isRestaurantOpen(r.business_hours),
          nextOpenTime: getNextOpenTime(r.business_hours),
        }));
        setRestaurants(restaurantsWithStatus);
      }
      setLoading(false);
    };

    fetchData();
  }, [city]);

  return (
    <>
      <AddressCaptureModal />
      <MarketingPopup />

      <main className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-4 pt-4 space-y-5">
          <HomeHeader />
        </div>

        {/* Marketing Banner */}
        <section className="px-4 mt-4">
          <MarketingBanner />
        </section>

        {/* CTA Login for non-connected users */}
        {!isConnected && (
          <section className="px-4 mt-4">
            <PersonalizedCTA />
          </section>
        )}

        {/* Favorites Section for connected users */}
        {isConnected && (
          <section className="mt-4">
            <FavoritesSection />
          </section>
        )}

        {/* Order Again for connected users with address */}
        {isConnected && hasAddress && (
          <section className="px-4 mt-4">
            <OrderAgainSection />
          </section>
        )}

        {/* Categories */}
        <div className="mt-4">
          <FoodCategories />
        </div>

        {/* Intention Filters */}
        <div className="mt-4">
          <IntentionFilters />
        </div>

        {/* Sponsored Restaurants */}
        <div className="mt-4">
          <SponsoredRestaurants />
        </div>

        {/* Restaurants */}
        <section className="px-4 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-foreground">
              {hasCity ? "Restaurants populaires" : "Restaurants"}
            </h2>
            <button
              onClick={() => navigate("/restaurants")}
              className="text-primary text-xs font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl bg-secondary" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="border border-border/50 rounded-xl text-center py-6 bg-card">
              <CardContent className="p-0">
                <Truck className="mx-auto mb-1.5 text-primary h-5 w-5" />
                <p className="text-xs font-medium text-foreground mb-1.5">
                  {hasCity ? "Bientôt disponible" : "Choisissez votre ville"}
                </p>
                {!hasCity && (
                  <button onClick={() => navigate('/welcome')} className="text-xs text-primary font-medium">
                    Définir ma localisation
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {restaurants.map((r) => (
                <Card
                  key={r.id}
                  className="group border-none rounded-xl overflow-hidden bg-card hover:bg-card/80 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/restaurant/${r.id}`)}
                >
                  <div className="relative h-24">
                    <LazyImage
                      src={r.image_url || "/placeholder.svg"}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Status indicator - open/closed */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                        r.isOpen !== false 
                          ? "bg-success text-success-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      }`}>
                        {r.isOpen !== false ? "Ouvert" : "Fermé"}
                      </span>
                    </div>
                    {hasAddress && (
                      <div className="absolute top-1.5 right-1.5" onClick={(e) => e.stopPropagation()}>
                        <FavoritesButton restaurantId={r.id} />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-2.5 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-semibold text-primary line-clamp-1">{r.name}</h3>
                      <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                        {r.delivery_fee ? `${r.delivery_fee.toLocaleString()} FC` : "Gratuit"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{r.cuisine_type}</p>
                    <div className="flex items-center gap-2 text-[10px] pt-0.5">
                      <span className="flex items-center gap-0.5 font-medium text-foreground">
                        <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                        {r.rating?.toFixed(1) || "4.5"}
                      </span>
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
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
