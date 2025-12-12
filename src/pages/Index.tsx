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
import { Search, Star, Clock, MapPin, ArrowRight, Truck, Sparkles, Zap } from "lucide-react";
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
      <main className="min-h-screen pb-20 md:pb-0 blob-bg">
        {/* Hero Section - Playful & Warm */}
        <section className="relative py-10 md:py-20 overflow-hidden">
          {/* Background Image with Warm Overlay */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${heroFood})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/90 to-background/70" />
          </div>
          
          {/* Decorative Blobs */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl animate-fade-in">
              {/* Badge */}
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5">
                <Zap className="w-3 h-3 mr-1" />
                Livraison rapide au Congo
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Vos plats préférés,{" "}
                <span className="text-gradient-primary">livrés chez vous</span> 🍔
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6">
                Des centaines de restaurants à portée de main. Commandez en quelques clics !
              </p>
              
              {/* Search Bar - Organic Style */}
              <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un restaurant, un plat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-card/80 backdrop-blur-sm border-2 border-border/50 focus:border-primary text-base"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl btn-playful">
                  <Search className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Rechercher</span>
                </Button>
              </form>

              {district && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Livraison vers <strong className="text-foreground">{district}, {city}</strong></span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Categories - Pill Style */}
        <section className="py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Catégories
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/restaurants")} className="rounded-full">
                Voir tout <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-32 flex-shrink-0 rounded-3xl" />
                ))
              ) : (
                categories.map((category, index) => (
                  <Card
                    key={category}
                    className="flex-shrink-0 w-32 cursor-pointer hover:shadow-hover transition-all duration-300 hover:-translate-y-2 overflow-hidden animate-fade-in border-none"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="relative h-20">
                      <img
                        src={categoryImages[category] || burgerImg}
                        alt={category}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    </div>
                    <CardContent className="p-2.5 text-center">
                      <span className="text-sm font-semibold line-clamp-1">{category}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Restaurants Grid - Float Cards */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Restaurants populaires 🔥</h2>
                <p className="text-sm text-muted-foreground mt-1">Les mieux notés près de chez vous</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/restaurants")} className="rounded-full hidden sm:flex">
                Tous les restaurants <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-3xl" />
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-3xl shadow-soft">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Bientôt disponible</h3>
                <p className="text-muted-foreground mb-6">
                  Nous préparons les meilleurs restaurants pour vous
                </p>
                <Button variant="outline" onClick={() => navigate("/auth")} className="rounded-full">
                  Devenir restaurant partenaire
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {restaurants.map((restaurant, index) => (
                  <Card
                    key={restaurant.id}
                    className="group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  >
                    <div className="relative h-40 sm:h-44 overflow-hidden">
                      <img
                        src={restaurant.image_url || "/placeholder.svg"}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {restaurant.rating > 0 && (
                        <Badge className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground rounded-full px-3">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary mr-1" />
                          {restaurant.rating.toFixed(1)}
                        </Badge>
                      )}
                      {restaurant.city && (
                        <Badge className="absolute top-3 left-3 bg-gradient-primary text-primary-foreground rounded-full px-3">
                          <MapPin className="w-3 h-3 mr-1" />
                          {restaurant.city}
                        </Badge>
                      )}
                      <div 
                        className="absolute bottom-3 right-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FavoritesButton restaurantId={restaurant.id} />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{restaurant.name}</h3>
                      {restaurant.cuisine_type && (
                        <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine_type}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{restaurant.delivery_time || "30-45 min"}</span>
                        </div>
                        <span className="font-semibold text-primary">{restaurant.delivery_fee} FCFA</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {restaurants.length > 0 && (
              <div className="text-center mt-10">
                <Button size="lg" onClick={() => navigate("/restaurants")} className="rounded-full px-10 btn-playful">
                  Voir tous les restaurants
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Stats - Social Proof with Playful Cards */}
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center py-6 md:py-8 border-none shadow-soft hover:shadow-hover transition-all hover:-translate-y-1">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-3xl md:text-4xl block">500+</span>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">Restaurants</p>
                </CardContent>
              </Card>
              <Card className="text-center py-6 md:py-8 border-none shadow-soft hover:shadow-hover transition-all hover:-translate-y-1">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-3xl md:text-4xl block">50k+</span>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">Commandes</p>
                </CardContent>
              </Card>
              <Card className="text-center py-6 md:py-8 border-none shadow-soft hover:shadow-hover transition-all hover:-translate-y-1">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-3xl md:text-4xl block">4.8/5</span>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">Note moyenne</p>
                </CardContent>
              </Card>
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
