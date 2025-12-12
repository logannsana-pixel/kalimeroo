import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdvancedSearch, SearchFilters } from "@/components/AdvancedSearch";
import { FavoritesButton } from "@/components/FavoritesButton";
import { HorizontalCard, HorizontalCardSkeleton } from "@/components/ui/horizontal-card";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters from URL params
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

  // Filter restaurants based on advanced search
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Text search (includes city search)
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

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (r: any) => r.cuisine_type === filters.category ||
        r.menu_items?.some((item: any) => item.category === filters.category)
      );
    }

    // Price filter (based on menu items)
    filtered = filtered.filter((r: any) => {
      if (!r.menu_items || r.menu_items.length === 0) return true;
      return r.menu_items.some((item: any) => 
        item.price >= filters.minPrice && item.price <= filters.maxPrice
      );
    });

    // Rating filter
    filtered = filtered.filter((r) => (r.rating || 0) >= filters.minRating);

    // Sort by rating
    filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return filtered;
  }, [restaurants, filters]);

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold mb-2">
            Tous les restaurants
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Commandez depuis n'importe quelle ville pour livraison partout au Congo
          </p>
        </div>

        <div className="mb-6">
          <AdvancedSearch onSearch={setFilters} initialFilters={initialFilters} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <HorizontalCardSkeleton key={i} variant="default" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-2">
              {filters.query || filters.category !== "all"
                ? "Aucun restaurant ne correspond à vos critères"
                : "Aucun restaurant disponible pour le moment"}
            </p>
            <p className="text-sm text-muted-foreground">
              Revenez bientôt, de nouveaux restaurants arrivent !
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? "s" : ""} trouvé{filteredRestaurants.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="relative">
                  <div className="absolute top-3 right-3 z-10 md:top-2 md:right-2">
                    <FavoritesButton restaurantId={restaurant.id} />
                  </div>
                  <HorizontalCard
                    imageUrl={restaurant.image_url || "/placeholder.svg"}
                    title={restaurant.name}
                    subtitle={restaurant.cuisine_type}
                    description={restaurant.description}
                    rating={restaurant.rating}
                    deliveryTime={restaurant.delivery_time}
                    badge={restaurant.city || undefined}
                    badgeVariant="secondary"
                    price={`${restaurant.delivery_fee?.toFixed(0) || 0} FCFA livraison`}
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                    variant="default"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
