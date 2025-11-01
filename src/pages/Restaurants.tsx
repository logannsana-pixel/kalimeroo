import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { useLocation } from "@/contexts/LocationContext";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
}

export default function Restaurants() {
  const navigate = useNavigate();
  const { city } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(restaurants.map(r => r.cuisine_type).filter(Boolean));
    return Array.from(uniqueCategories);
  }, [restaurants]);

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.cuisine_type?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.cuisine_type === selectedCategory);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "delivery_time":
          return parseInt(a.delivery_time) - parseInt(b.delivery_time);
        case "delivery_fee":
          return (a.delivery_fee || 0) - (b.delivery_fee || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [restaurants, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          Restaurants disponibles à {city}
        </h1>

        <RestaurantFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
        />

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
              {searchQuery || selectedCategory !== "all"
                ? "Aucun restaurant ne correspond à vos critères"
                : "Aucun restaurant disponible pour le moment"}
            </p>
            <p className="text-sm text-muted-foreground">
              Revenez bientôt, de nouveaux restaurants arrivent ! 🍴
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
                  className="cursor-pointer hover:shadow-hover transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={restaurant.image_url || "/placeholder.svg"}
                      alt={restaurant.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-2">
                      <span className="text-base md:text-lg line-clamp-1">{restaurant.name}</span>
                      <div className="flex items-center text-sm whitespace-nowrap">
                        <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                        <span>{restaurant.rating}</span>
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
                        <span>{restaurant.delivery_fee.toFixed(0)} FCFA</span>
                      </div>
                    </div>
                    <span className="inline-block text-xs bg-secondary px-2 py-1 rounded-full">
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
    </div>
  );
}
