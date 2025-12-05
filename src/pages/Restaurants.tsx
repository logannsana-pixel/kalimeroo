import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, DollarSign, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdvancedSearch, SearchFilters } from "@/components/AdvancedSearch";
import { FavoritesButton } from "@/components/FavoritesButton";

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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    minPrice: 0,
    maxPrice: 100,
    minRating: 0,
  });

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
          <AdvancedSearch onSearch={setFilters} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="cursor-pointer hover:shadow-hover transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={restaurant.image_url || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                      <FavoritesButton restaurantId={restaurant.id} />
                    </div>
                    {restaurant.city && (
                      <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {restaurant.city}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span className="text-base md:text-lg line-clamp-1">{restaurant.name}</span>
                      <div className="flex items-center text-sm whitespace-nowrap">
                        <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                        <span>{restaurant.rating || "Nouveau"}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{restaurant.delivery_time}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>{restaurant.delivery_fee?.toFixed(0) || 0} FCFA</span>
                      </div>
                    </div>
                    <span className="inline-block text-xs bg-gradient-secondary text-secondary-foreground px-3 py-1 rounded-full">
                      {restaurant.cuisine_type}
                    </span>
                  </CardContent>
                </Card>
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
