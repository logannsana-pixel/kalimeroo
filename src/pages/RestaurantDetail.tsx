import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ThumbsUp, Bike, Search, ArrowLeft, RotateCcw } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MenuItemDetailModal } from "@/components/MenuItemDetailModal";
import { ReviewsList } from "@/components/ReviewsList";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/ui/menu-item-card";
import { LazyImage } from "@/components/LazyImage";
import { cn } from "@/lib/utils";

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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ itemId: string; quantity: number; options: any[] } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'takeaway'>('delivery');
  const [searchQuery, setSearchQuery] = useState('');

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
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    await refreshCart();
    if (pendingAction) {
      await addToCart(pendingAction.itemId, pendingAction.quantity, pendingAction.options);
      setPendingAction(null);
    }
  };

  const handleQuickAdd = async (itemId: string) => {
    await handleAddToCart(itemId, 1);
  };

  // Filter menu items by search
  const filteredMenuItems = menuItems.filter(item => 
    !searchQuery || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <div className="relative h-44">
          <Skeleton className="w-full h-full" />
          <div className="absolute top-4 left-4">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
        <div className="relative -mt-14 mx-4">
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="px-4 mt-4">
          <Skeleton className="h-11 rounded-full mb-4" />
          {[...Array(4)].map((_, i) => (
            <MenuItemCardSkeleton key={i} />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      {/* Hero Image with Back Button */}
      <div className="relative h-44">
        <LazyImage
          src={restaurant.image_url || "/placeholder.svg"}
          alt={restaurant.name}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Restaurant Info Card - Floating */}
      <div className="relative -mt-12 mx-4 z-10">
        <div className="bg-card rounded-2xl shadow-lg p-3">
          {/* Restaurant Name */}
          <h1 className="text-base font-bold text-center mb-2">{restaurant.name}</h1>

          {/* Delivery/Takeaway Toggle */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex bg-muted rounded-full p-0.5">
              <button
                onClick={() => setDeliveryMode('delivery')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  deliveryMode === 'delivery' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Bike className="w-3.5 h-3.5" />
                Livraison
              </button>
              <button
                onClick={() => setDeliveryMode('takeaway')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  deliveryMode === 'takeaway' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                À emporter
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center items-center gap-5 text-[11px]">
            <div className="flex flex-col items-center">
              <Clock className="w-3.5 h-3.5 mb-0.5 text-muted-foreground" />
              <span className="font-semibold">{restaurant.delivery_time || "20-30'"}</span>
            </div>
            <div className="flex flex-col items-center">
              <ThumbsUp className="w-3.5 h-3.5 mb-0.5 text-muted-foreground" />
              <span className="font-semibold">{restaurant.rating ? `${Math.round(restaurant.rating * 10)}%` : "—"}</span>
            </div>
            <div className="flex flex-col items-center">
              <Bike className="w-3.5 h-3.5 mb-0.5 text-muted-foreground" />
              <span className="font-semibold">{restaurant.delivery_fee?.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 rounded-full bg-muted/50 border-0 text-sm focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-3 flex-1">
        {Object.keys(groupedMenuItems).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "Aucun plat trouvé" : "Aucun plat disponible"}
            </p>
          </div>
        ) : (
          Object.entries(groupedMenuItems).map(([category, items]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm">🍽️</span>
                <h2 className="text-sm font-semibold">{category}</h2>
              </div>
              <div className="divide-y divide-border/30">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    imageUrl={item.image_url}
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    onClick={() => handleItemClick(item)}
                    onAdd={() => handleQuickAdd(item.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reviews Section */}
      <div className="px-4 py-3 border-t border-border/30 bg-muted/20">
        <h2 className="text-sm font-semibold mb-2">Avis clients</h2>
        <ReviewsList restaurantId={restaurant.id} />
      </div>

      <Footer className="hidden md:block" />
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
