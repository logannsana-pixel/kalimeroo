import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Restaurant Header */}
        <div className="relative h-64 md:h-80">
          <img
            src={restaurant.image_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="container mx-auto">
              <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-lg mb-4">{restaurant.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{restaurant.delivery_time}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>Livraison: {restaurant.delivery_fee.toFixed(2)}€</span>
                </div>
                <div>
                  <span>Commande min: {restaurant.min_order.toFixed(2)}€</span>
                </div>
                <div className="bg-secondary px-3 py-1 rounded-full">
                  {restaurant.cuisine_type}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="container mx-auto px-4 py-8">
          {Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image_url && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          {Number(item.price).toFixed(2)}€
                        </span>
                        <div className="flex items-center gap-2">
                          {quantities[item.id] > 0 && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center">
                                {quantities[item.id]}
                              </span>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          {quantities[item.id] > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item.id)}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
