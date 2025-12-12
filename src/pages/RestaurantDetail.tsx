import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, DollarSign, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MenuItemDetailModal } from "@/components/MenuItemDetailModal";
import { ReviewsList } from "@/components/ReviewsList";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { HorizontalCard, HorizontalCardSkeleton } from "@/components/ui/horizontal-card";

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
  const { user } = useAuth();
  const { addToCart, refreshCart } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ itemId: string; quantity: number; options: any[] } | null>(null);

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

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = async (itemId: string, quantity: number = 1, selectedOptions: any[] = []) => {
    if (!user) {
      setPendingAction({ itemId, quantity, options: selectedOptions });
      setShowAuthModal(true);
      return;
    }
    await addToCart(itemId, quantity, selectedOptions);
    setQuantities((prev) => ({ ...prev, [itemId]: 0 }));
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await refreshCart();
    if (pendingAction) {
      await addToCart(pendingAction.itemId, pendingAction.quantity, pendingAction.options);
      setQuantities((prev) => ({ ...prev, [pendingAction.itemId]: 0 }));
      setPendingAction(null);
    }
  };

  const handleQuickAdd = async (itemId: string) => {
    const quantity = quantities[itemId] || 1;
    await handleAddToCart(itemId, quantity);
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
          <Skeleton className="h-48 md:h-64 w-full rounded-3xl mb-6 md:mb-8" />
          <Skeleton className="h-6 md:h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <HorizontalCardSkeleton key={i} variant="default" />
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
              <p className="text-sm sm:text-base md:text-lg mb-3 md:mb-4 line-clamp-2 opacity-90">
                {restaurant.description}
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{restaurant.delivery_time}</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{restaurant.delivery_fee.toFixed(0)} FCFA</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span>Min: {restaurant.min_order.toFixed(0)} FCFA</span>
                </div>
                <div className="bg-primary px-3 py-1.5 rounded-full font-medium">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <HorizontalCard
                      key={item.id}
                      imageUrl={item.image_url}
                      title={item.name}
                      description={item.description}
                      price={Number(item.price)}
                      onClick={() => handleItemClick(item)}
                      showQuantity={quantities[item.id] > 0}
                      quantity={quantities[item.id] || 0}
                      onIncrement={() => handleQuantityChange(item.id, 1)}
                      onDecrement={() => handleQuantityChange(item.id, -1)}
                      onCtaClick={
                        quantities[item.id] > 0
                          ? () => handleQuickAdd(item.id)
                          : () => handleQuantityChange(item.id, 1)
                      }
                      ctaText={quantities[item.id] > 0 ? "Ajouter" : "Ajouter"}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reviews Section */}
        <div className="container mx-auto px-4 py-6 md:py-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Avis clients</h2>
          <ReviewsList restaurantId={restaurant.id} />
        </div>
      </main>
      <Footer />
      <BottomNav />
      
      <MenuItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
      
      <GuestCheckoutModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
