import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { FoodCategories } from "@/components/FoodCategories";
import { OrderAgainSection } from "@/components/OrderAgainSection";
import { FavoritesSection } from "@/components/FavoritesSection";
import { SearchOverlay } from "@/components/SearchOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Star, Clock, ArrowRight, Truck, Search, MapPin } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { FavoritesButton } from "@/components/FavoritesButton";
import { LazyImage } from "@/components/LazyImage";
import { useAuth } from "@/hooks/useAuth";
import { MarketingBanner } from "@/components/marketing/MarketingBanner";
import { MarketingPopup } from "@/components/marketing/MarketingPopup";
import { SponsoredRestaurants } from "@/components/marketing/SponsoredRestaurants";
import { NotificationBell } from "@/components/NotificationBell";
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

const FILTER_CHIPS = [
  { label: "Tout", value: "all", icon: "" },
  { label: "⭐ Top notés", value: "top_rated", icon: "" },
  { label: "🚀 Rapide", value: "fast", icon: "" },
  { label: "💰 Gratuit", value: "free_delivery", icon: "" },
  { label: "🔥 Promo", value: "promo", icon: "" },
  { label: "🆕 Nouveau", value: "new", icon: "" },
];

const Index = () => {
  const navigate = useNavigate();
  const { district, city, address, openModal } = useLocation();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);

  const hasAddress = !!district && !!address;
  const isConnected = !!user;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee, city, business_hours")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(10);

      if (city) query = query.eq("city", city);

      const { data } = await query;
      if (data) {
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

  const filteredRestaurants = restaurants.filter((r) => {
    if (activeFilter === "top_rated") return (r.rating || 0) >= 4;
    if (activeFilter === "fast") return parseInt(r.delivery_time || "99") <= 30;
    if (activeFilter === "free_delivery") return r.delivery_fee === 0;
    return true;
  });

  return (
    <>
      <AddressCaptureModal />
      <MarketingPopup />
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />

      <main className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-display font-bold text-foreground">
                {firstName ? `Bonjour ${firstName} 👋` : "Bienvenue 👋"}
              </h1>
              <button onClick={openModal} className="flex items-center gap-1 text-xs text-muted-foreground font-body mt-0.5">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="truncate max-w-[180px]">{district || city || "Définir ma position"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && <NotificationBell />}
            </div>
          </div>

          {/* Searchbar */}
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2 bg-surface-3 px-4 py-3 rounded-2xl text-muted-foreground transition-all hover:bg-muted"
          >
            <Search className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left text-sm font-body">Pizza, sushi, burger...</span>
          </button>
        </header>

        {/* Marketing Banner */}
        <section className="px-4 mt-3">
          <MarketingBanner />
        </section>

        {/* Favorites */}
        {isConnected && (
          <section className="mt-4">
            <FavoritesSection />
          </section>
        )}

        {/* Order Again */}
        {isConnected && hasAddress && (
          <section className="px-4 mt-4">
            <OrderAgainSection />
          </section>
        )}

        {/* Food Categories */}
        <div className="mt-4">
          <FoodCategories />
        </div>

        {/* Filter Chips */}
        <div className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setActiveFilter(chip.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all ${
                  activeFilter === chip.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-primary/20 text-primary"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sponsored Restaurants */}
        <div className="mt-4">
          <SponsoredRestaurants />
        </div>

        {/* Restaurants Grid */}
        <section className="px-4 mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-foreground">
              Restaurants populaires
            </h2>
            <button
              onClick={() => navigate("/restaurants")}
              className="text-primary text-xs font-body font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <Card className="border border-border rounded-2xl text-center py-8 bg-card">
              <CardContent className="p-0">
                <Truck className="mx-auto mb-2 text-primary h-6 w-6" />
                <p className="text-sm font-display font-medium text-foreground mb-1">
                  Aucun restaurant trouvé
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Essayez un autre filtre
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRestaurants.map((r) => {
                const isClosed = r.isOpen === false;
                return (
                  <Card
                    key={r.id}
                    className={`border-none rounded-2xl overflow-hidden bg-card shadow-card cursor-pointer transition-all active:scale-[0.98] relative ${
                      isClosed ? "grayscale opacity-60" : ""
                    }`}
                    onClick={() => navigate(`/restaurant/${r.id}`)}
                  >
                    <div className="relative h-40">
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
                      {r.delivery_fee === 0 && !isClosed && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-success text-white text-2xs font-body font-medium">
                          Livraison gratuite
                        </span>
                      )}
                    </div>

                    <CardContent className="p-3 space-y-1">
                      <h3 className="text-base font-display font-semibold text-foreground line-clamp-1">{r.name}</h3>
                      <p className="text-xs text-muted-foreground font-body line-clamp-1">{r.cuisine_type}</p>
                      <div className="flex items-center gap-3 text-xs font-body pt-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                          {r.rating?.toFixed(1) || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {r.delivery_time || "20-30"} min
                        </span>
                        <span className="text-muted-foreground">
                          🛵 {r.delivery_fee ? `${r.delivery_fee.toLocaleString()} FCFA` : "Gratuit"}
                        </span>
                      </div>
                    </CardContent>

                    {isClosed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                        <span className="text-sm font-display font-bold text-foreground">Fermé</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </>
  );
};

export default Index;
