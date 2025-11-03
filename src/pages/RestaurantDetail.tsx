import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, DollarSign, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  image_url: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  min_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", id)
        .eq("is_available", true);

      if (menuError) throw menuError;
      setMenuItems(menuData || []);
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      toast.error("Erreur lors du chargement du restaurant");
      navigate("/restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const handleAddToCart = async (itemId: string) => {
    const quantity = quantities[itemId] || 1;
    await addToCart(itemId, quantity);
    setQuantities((prev) => ({ ...prev, [itemId]: 0 }));
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <Skeleton className="h-48 md:h-64 w-full rounded-lg mb-6 md:mb-8" />
          <Skeleton className="h-6 md:h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 md:h-64 w-full" />
            ))}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1">
        {/* Restaurant Header */}
        <div className="relative h-48 sm:h-64 md:h-80">
          <img
            src={restaurant.image_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
            <div className="container mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-sm sm:text-base md:text-lg mb-3 md:mb-4 line-clamp-2">
                {restaurant.description}
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                <div className="flex items-center bg-black/30 px-2 py-1 rounded">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="flex items-center bg-black/30 px-2 py-1 rounded">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{restaurant.delivery_time}</span>
                </div>
                <div className="flex items-center bg-black/30 px-2 py-1 rounded">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{restaurant.delivery_fee.toFixed(0)} FCFA</span>
                </div>
                <div className="bg-black/30 px-2 py-1 rounded">
                  <span>Min: {restaurant.min_order.toFixed(0)} FCFA</span>
                </div>
                <div className="bg-primary/90 px-2 py-1 rounded">
                  {restaurant.cuisine_type}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          {Object.keys(groupedMenuItems).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun plat disponible pour le moment</p>
            </div>
          ) : (
            Object.entries(groupedMenuItems).map(([category, items]) => (
              <div key={category} className="mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden flex flex-col">
                      {item.image_url && (
                        <div className="h-40 sm:h-48 overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-3 md:p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">
                          {item.name}
                        </h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2 flex-1">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base md:text-lg font-bold whitespace-nowrap">
                            {Number(item.price).toFixed(0)} FCFA
                          </span>
                          <div className="flex items-center gap-1 md:gap-2">
                            {quantities[item.id] > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                >
                                  <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                                <span className="w-6 md:w-8 text-center text-sm">
                                  {quantities[item.id]}
                                </span>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuantityChange(item.id, 1)}
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            {quantities[item.id] > 0 && (
                              <Button
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleAddToCart(item.id)}
                              >
                                <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
