import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { LocationModal } from "@/components/LocationModal";
import { BlobCategories } from "@/components/BlobCategories";
import { PromoBanner } from "@/components/PromoBanner";
import { OrderAgainSection } from "@/components/OrderAgainSection";
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
  const [searchQuery, setSearchQuery] = useState("");
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
        .limit(8);

      // Filter by city if address is set
      if (city) {
        query = query.eq("city", city);
      }

      const { data: restaurantsData } = await query;

      if (restaurantsData) {
        setRestaurants(restaurantsData);
      }
      setLoading(false);
    };

    fetchData();
  }, [city]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAddress) {
      openModal();
      return;
    }
    navigate(`/restaurants?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <LocationModal />
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0 blob-bg">
        {/* Hero Section */}
        <section className="relative py-8 md:py-16 overflow-hidden">
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
              
              {/* Address Button - More prominent when no address */}
              {!hasAddress && (
                <Button
                  onClick={openModal}
                  size="lg"
                  className="w-full sm:w-auto mb-4 h-14 rounded-2xl btn-playful gap-3 text-base"
                >
                  <MapPin className="h-5 w-5" />
                  Définir mon adresse
                </Button>
              )}
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={hasAddress ? "Rechercher un restaurant, un plat..." : "Définissez d'abord votre adresse"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={() => !hasAddress && openModal()}
                    className={`pl-12 h-14 rounded-2xl bg-card/80 backdrop-blur-sm border-2 text-base ${
                      hasAddress ? "border-border/50 focus:border-primary" : "border-muted cursor-pointer"
                    }`}
                    readOnly={!hasAddress}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 rounded-2xl btn-playful"
                  disabled={!hasAddress}
                >
                  <Search className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Rechercher</span>
                </Button>
              </form>

              {/* Current Address Display */}
              {hasAddress && (
                <button 
                  onClick={openModal}
                  className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 w-fit hover:bg-card/80 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Livraison vers <strong className="text-foreground">{district}, {city}</strong></span>
                  <span className="text-xs text-primary">Modifier</span>
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {/* Promo Banner */}
          <section className="py-4 md:py-6">
            <PromoBanner />
          </section>

          {/* Blob Categories */}
          <section className="py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Catégories
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => hasAddress ? navigate("/restaurants") : openModal()} 
                className="rounded-full text-primary"
              >
                Voir tout <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <BlobCategories disabled={!hasAddress} onDisabledClick={openModal} />
          </section>

          {/* Order Again Section - Only show if address is set */}
          {hasAddress && <OrderAgainSection />}

          {/* Popular Restaurants */}
          <section className="py-6 md:py-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {hasAddress ? "Restaurants populaires 🔥" : "Restaurants disponibles"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasAddress 
                    ? "Les mieux notés près de chez vous" 
                    : "Définissez votre adresse pour voir les restaurants à proximité"
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => hasAddress ? navigate("/restaurants") : openModal()} 
                className="rounded-full hidden sm:flex"
              >
                Tous les restaurants <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-3xl shadow-soft">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {hasAddress ? "Bientôt disponible" : "Définissez votre adresse"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {hasAddress 
                    ? "Nous préparons les meilleurs restaurants pour vous"
                    : "Pour découvrir les restaurants disponibles dans votre zone"
                  }
                </p>
                {!hasAddress && (
                  <Button onClick={openModal} className="rounded-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    Définir mon adresse
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {restaurants.map((restaurant, index) => (
                  <Card
                    key={restaurant.id}
                    className={`group cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in rounded-3xl ${
                      !hasAddress ? "opacity-75" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => hasAddress ? navigate(`/restaurant/${restaurant.id}`) : openModal()}
                  >
                    {/* Image */}
                    <div className="relative h-32 sm:h-40 overflow-hidden">
                      <img
                        src={restaurant.image_url || "/placeholder.svg"}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Promo Badge */}
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        15% off
                      </Badge>
                      {/* Favorite Button */}
                      {hasAddress && (
                        <div 
                          className="absolute top-3 right-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FavoritesButton restaurantId={restaurant.id} />
                        </div>
                      )}
                      {/* City Badge */}
                      {restaurant.city && (
                        <Badge className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm text-foreground rounded-full px-2.5 py-0.5 text-xs">
                          {restaurant.city}
                        </Badge>
                      )}
                    </div>
                    {/* Content */}
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-1">{restaurant.name}</h3>
                      {restaurant.cuisine_type && (
                        <p className="text-xs text-muted-foreground mb-2">{restaurant.cuisine_type}</p>
                      )}
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                          <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{restaurant.delivery_time || "30-45"}</span>
                        </div>
                        <span className="font-semibold text-primary">{restaurant.delivery_fee} FCFA</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {restaurants.length > 0 && (
              <div className="text-center mt-8">
                <Button 
                  size="lg" 
                  onClick={() => hasAddress ? navigate("/restaurants") : openModal()} 
                  className="rounded-full px-10 btn-playful"
                >
                  Voir tous les restaurants
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </section>

          {/* Stats */}
          <section className="py-8 md:py-12">
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center py-6 md:py-8 border-none shadow-soft rounded-3xl">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-2xl md:text-4xl block">500+</span>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Restaurants</p>
                </CardContent>
              </Card>
              <Card className="text-center py-6 md:py-8 border-none shadow-soft rounded-3xl">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-2xl md:text-4xl block">50k+</span>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Commandes</p>
                </CardContent>
              </Card>
              <Card className="text-center py-6 md:py-8 border-none shadow-soft rounded-3xl">
                <CardContent className="p-0">
                  <span className="font-bold text-gradient-primary text-2xl md:text-4xl block">4.8/5</span>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Note moyenne</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <Footer />
      </main>
      <BottomNav />
    </>
  );
};

export default Index;
