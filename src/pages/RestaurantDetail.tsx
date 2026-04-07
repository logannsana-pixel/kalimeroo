import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Star, Bike, Search, ArrowLeft, Heart, AlertCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MenuItemDetailModal } from "@/components/MenuItemDetailModal";
import { ReviewsList } from "@/components/ReviewsList";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/ui/menu-item-card";
import { LazyImage } from "@/components/LazyImage";
import { FavoritesButton } from "@/components/FavoritesButton";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useDocumentTitle(
    restaurant ? `${restaurant.name} | Commander sur Kalimero` : "Restaurant",
    restaurant?.description
  );

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyHeader(window.scrollY > 240);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const filteredMenuItems = useMemo(() => menuItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [menuItems, searchQuery, selectedCategory]);

  const categories = useMemo(() => [...new Set(menuItems.map(item => item.category || "Autres"))], [menuItems]);

  const groupedMenuItems = useMemo(() => filteredMenuItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>), [filteredMenuItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <div className="relative h-60">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-11 rounded-full" />
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
      {/* Sticky Header */}
      {showStickyHeader && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/30 px-4 py-2.5 flex items-center gap-3 animate-in slide-in-from-top-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{restaurant.name}</p>
            <p className="text-[11px] text-muted-foreground">
              ⭐ {restaurant.rating || "—"} · 🕐 {restaurant.delivery_time || "20-30"} min · 🛵 {restaurant.delivery_fee?.toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>
      )}

      {/* Hero Image */}
      <div ref={heroRef} className="relative h-60">
        <LazyImage
          src={restaurant.image_url || "/placeholder.svg"}
          alt={restaurant.name}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

        {/* Name overlay on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white mb-1">{restaurant.name}</h1>
          <div className="flex items-center gap-1 text-white/90 text-sm">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span className="font-medium">{restaurant.rating || "—"}</span>
            <span className="text-white/60 mx-1">·</span>
            <span>{restaurant.cuisine_type}</span>
          </div>
        </div>

        {/* Back & Favorite Buttons */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div className="absolute top-4 right-4">
          <FavoritesButton restaurantId={restaurant.id} variant="ghost" />
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-card border-b border-border/30 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold">{restaurant.delivery_time || "20-30"} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="font-semibold">{restaurant.rating ? `${restaurant.rating}/5` : "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold">
                {restaurant.delivery_fee === 0 ? (
                  <span className="text-accent">Gratuit</span>
                ) : (
                  `${restaurant.delivery_fee?.toLocaleString('fr-FR')} F`
                )}
              </span>
            </div>
          </div>
        </div>
        {restaurant.min_order > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>Minimum de commande : {restaurant.min_order?.toLocaleString('fr-FR')} FCFA</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-3">
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

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

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
