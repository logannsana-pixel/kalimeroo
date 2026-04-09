import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdvancedSearch, SearchFilters } from "@/components/AdvancedSearch";
import { FavoritesButton } from "@/components/FavoritesButton";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/ui/restaurant-card";
import { FilterSheet, ActiveFilterChips, defaultFilters, type FilterValues } from "@/components/FilterSheet";
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { isRestaurantOpen } from "@/hooks/useRestaurantAvailability";
import { motion } from "framer-motion";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  city: string | null;
}

export default function Restaurants() {
  useDocumentTitle("Restaurants", "Découvrez tous les restaurants disponibles pour la livraison à Brazzaville et Pointe-Noire");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState<FilterValues>(defaultFilters);

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery, category: initialCategory, minPrice: 0, maxPrice: 50000, minRating: 0,
  });

  const initialFilters = useMemo(() => ({ query: initialQuery, category: initialCategory }), [initialQuery, initialCategory]);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants").select("*, menu_items(id, name, price, category)").eq("is_active", true);
      if (error) throw error;
      setRestaurants((data || []).map((r: any) => ({ ...r, isOpen: isRestaurantOpen(r.business_hours) })));
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.name.toLowerCase().includes(q) || r.cuisine_type?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q) ||
        r.menu_items?.some((item: any) => item.name.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q))
      );
    }
    if (filters.category !== "all") filtered = filtered.filter((r: any) => r.cuisine_type === filters.category || r.menu_items?.some((item: any) => item.category === filters.category));
    filtered = filtered.filter(r => (r.rating || 0) >= filters.minRating);
    // Advanced
    if (advancedFilters.freeDelivery) filtered = filtered.filter(r => r.delivery_fee === 0);
    if (advancedFilters.maxDeliveryTime) filtered = filtered.filter(r => parseInt(r.delivery_time || "99") <= advancedFilters.maxDeliveryTime!);
    if (advancedFilters.minRating > 0) filtered = filtered.filter(r => (r.rating || 0) >= advancedFilters.minRating);
    if (advancedFilters.openNow) filtered = filtered.filter((r: any) => r.isOpen !== false);
    if (advancedFilters.cuisineTypes.length > 0) filtered = filtered.filter(r => advancedFilters.cuisineTypes.includes(r.cuisine_type || ""));
    // Sort
    filtered = [...filtered].sort((a: any, b: any) => {
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      if (advancedFilters.sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (advancedFilters.sortBy === "delivery_time") return parseInt(a.delivery_time || "99") - parseInt(b.delivery_time || "99");
      if (advancedFilters.sortBy === "delivery_fee") return (a.delivery_fee || 0) - (b.delivery_fee || 0);
      return (b.rating || 0) - (a.rating || 0);
    });
    return filtered;
  }, [restaurants, filters, advancedFilters]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <AddressCaptureModal />
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-lg font-semibold flex-1">Restaurants</h1>
            <FilterSheet filters={advancedFilters} onChange={setAdvancedFilters} />
          </div>
          <div className="mb-3"><AdvancedSearch onSearch={setFilters} initialFilters={initialFilters} /></div>
          <ActiveFilterChips filters={advancedFilters} onChange={setAdvancedFilters} />
          {!loading && filteredRestaurants.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">{filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? "s" : ""}</p>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <RestaurantCardSkeleton key={i} />)}</div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground mb-2">Aucun restaurant ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredRestaurants.map((restaurant: any, i) => {
                const isClosed = restaurant.isOpen === false;
                return (
                  <motion.div key={restaurant.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                    className={`relative ${isClosed ? "grayscale opacity-60" : ""}`}>
                    <div className="absolute top-2 right-2 z-10"><FavoritesButton restaurantId={restaurant.id} /></div>
                    {restaurant.is_sponsored && (
                      <Badge className="absolute top-2 left-2 z-10 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />Vedette
                      </Badge>
                    )}
                    <RestaurantCard imageUrl={restaurant.image_url || "/placeholder.svg"} name={restaurant.name}
                      rating={restaurant.rating ? Math.round(restaurant.rating * 10) : undefined} badge={restaurant.city || undefined}
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)} />
                    {isClosed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-xl">
                        <span className="text-xs font-semibold text-foreground">Fermé</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    </PageTransition>
  );
}
