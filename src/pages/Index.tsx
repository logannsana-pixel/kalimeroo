import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { LocationModal } from "@/components/LocationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, Star, Clock, MapPin, ArrowRight, Truck } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { FavoritesButton } from "@/components/FavoritesButton";
import heroFood from "@/assets/hero-food.jpg";
import burgerImg from "@/assets/burger.jpg";
import pizzaImg from "@/assets/pizza.jpg";
import sushiImg from "@/assets/sushi.jpg";
import pastaImg from "@/assets/pasta.jpg";

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

const categoryImages: Record<string, string> = {
  "Africaine": burgerImg,
  "Pizza": pizzaImg,
  "Fast Food": burgerImg,
  "Chinoise": sushiImg,
  "Indienne": pastaImg,
  "Italienne": pastaImg,
};

const Index = () => {
  const navigate = useNavigate();
  const { district, city } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee, city")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(8);

      if (restaurantsData) {
        setRestaurants(restaurantsData);
        const uniqueCategories = [...new Set(restaurantsData.map(r => r.cuisine_type).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/restaurants?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/restaurants?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      <LocationModal />
      <Navbar />
      <main className="min-h-screen pb-16 md:pb-0">
        {/* Hero Section - Compact & Action-focused */}
        <section className="relative py-8 md:py-16 overflow-hidden">
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${heroFood})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/90 to-background/80" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
                Commandez vos plats préférés
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Livraison rapide partout au Congo
              </p>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Restaurant, plat, cuisine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-background/80 backdrop-blur-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6">
                  <Search className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Rechercher</span>
                </Button>
              </form>

              {district && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Livraison vers <strong className="text-foreground">{district}, {city}</strong></span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Categories */}
        <section className="py-6 md:py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold">Catégories</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/restaurants")}>
                Voir tout <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-28 flex-shrink-0 rounded-xl" />
                ))
              ) : (
                categories.map((category) => (
                  <Card
                    key={category}
                    className="flex-shrink-0 w-28 cursor-pointer hover:shadow-hover transition-all duration-200 hover:-translate-y-1 overflow-hidden"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="relative h-16">
                      <img
                        src={categoryImages[category] || burgerImg}
                        alt={category}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    </div>
                    <CardContent className="p-2 text-center">
                      <span className="text-xs font-medium line-clamp-1">{category}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Restaurants Grid */}
        <section className="py-6 md:py-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Restaurants populaires</h2>
                <p className="text-sm text-muted-foreground">Les mieux notés près de chez vous</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/restaurants")}>
                Tous les restaurants <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bientôt disponible</h3>
                <p className="text-muted-foreground mb-4">
                  Nous préparons les meilleurs restaurants pour vous
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Créer un compte restaurateur
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {restaurants.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  >
                    <div className="relative h-36 sm:h-40 overflow-hidden">
                      <img
                        src={restaurant.image_url || "/placeholder.svg"}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {restaurant.rating > 0 && (
                        <Badge className="absolute top-2 right-2 bg-background/90 text-foreground text-xs">
                          <Star className="w-3 h-3 fill-primary text-primary mr-1" />
                          {restaurant.rating.toFixed(1)}
                        </Badge>
                      )}
                      {restaurant.city && (
                        <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {restaurant.city}
                        </Badge>
                      )}
                      <div 
                        className="absolute bottom-2 right-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoritesButton restaurantId={restaurant.id} />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold mb-1 line-clamp-1">{restaurant.name}</h3>
                      {restaurant.cuisine_type && (
                        <p className="text-xs text-muted-foreground mb-2">{restaurant.cuisine_type}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{restaurant.delivery_time || "30-45 min"}</span>
                        </div>
                        <span className="font-medium">{restaurant.delivery_fee} FCFA</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {restaurants.length > 0 && (
              <div className="text-center mt-8">
                <Button size="lg" onClick={() => navigate("/restaurants")}>
                  Voir tous les restaurants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Simple Stats - Social Proof */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="font-bold text-primary text-xl md:text-2xl block">500+</span>
                <p className="text-xs md:text-sm text-muted-foreground">Restaurants</p>
              </div>
              <div>
                <span className="font-bold text-primary text-xl md:text-2xl block">50k+</span>
                <p className="text-xs md:text-sm text-muted-foreground">Commandes</p>
              </div>
              <div>
                <span className="font-bold text-primary text-xl md:text-2xl block">4.8/5</span>
                <p className="text-xs md:text-sm text-muted-foreground">Note</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
      <BottomNav />
    </>
  );
};

export default Index;
