import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdvancedSearch, SearchFilters } from "@/components/AdvancedSearch";
import { FavoritesButton } from "@/components/FavoritesButton";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/ui/restaurant-card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
  
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    category: initialCategory,
    minPrice: 0,
    maxPrice: 50000,
    minRating: 0,
  });

  const initialFilters = useMemo(() => ({
    query: initialQuery,
    category: initialCategory,
  }), [initialQuery, initialCategory]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      let query = supabase
        .from("restaurants")
        .select("*, menu_items(id, name, price, category)")
        .eq("is_active", true);

      const { data, error } = await query;

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (r: any) =>
          r.name.toLowerCase().includes(query) ||
          r.cuisine_type?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.city?.toLowerCase().includes(query) ||
          r.menu_items?.some((item: any) => 
            item.name.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query)
          )
      );
    }

    if (filters.category !== "all") {
      filtered = filtered.filter(
        (r: any) => r.cuisine_type === filters.category ||
        r.menu_items?.some((item: any) => item.category === filters.category)
      );
    }

    filtered = filtered.filter((r: any) => {
      if (!r.menu_items || r.menu_items.length === 0) return true;
      return r.menu_items.some((item: any) => 
        item.price >= filters.minPrice && item.price <= filters.maxPrice
      );
    });

    filtered = filtered.filter((r) => (r.rating || 0) >= filters.minRating);
    
    // Sort: sponsored first, then by rating
    filtered = [...filtered].sort((a: any, b: any) => {
      // Sponsored restaurants first
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      // Then by sponsored position
      if (a.is_sponsored && b.is_sponsored) {
        return (a.sponsored_position || 0) - (b.sponsored_position || 0);
      }
      // Then by rating
      return (b.rating || 0) - (a.rating || 0);
    });

    return filtered;
  }, [restaurants, filters]);

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      <AddressCaptureModal />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-semibold">Restaurants</h1>
        </div>
        
        {/* Search Section */}
        <div className="mb-4">
          <AdvancedSearch onSearch={setFilters} initialFilters={initialFilters} />
        </div>

        {/* Results Count */}
        {!loading && filteredRestaurants.length > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? "s" : ""} trouvé{filteredRestaurants.length > 1 ? "s" : ""}
          </p>
        )}

        {/* Restaurant Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-2">
              {filters.query || filters.category !== "all"
                ? "Aucun restaurant ne correspond à vos critères"
                : "Aucun restaurant disponible pour le moment"}
            </p>
            <p className="text-xs text-muted-foreground">
              Revenez bientôt, de nouveaux restaurants arrivent !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredRestaurants.map((restaurant: any) => (
              <div key={restaurant.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <FavoritesButton restaurantId={restaurant.id} />
                </div>
                {restaurant.is_sponsored && (
                  <Badge className="absolute top-2 left-2 z-10 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    Vedette
                  </Badge>
                )}
                <RestaurantCard
                  imageUrl={restaurant.image_url || "/placeholder.svg"}
                  name={restaurant.name}
                  rating={restaurant.rating ? Math.round(restaurant.rating * 10) : undefined}
                  badge={restaurant.city || undefined}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
