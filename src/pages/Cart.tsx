import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Store, ChevronLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/LazyImage";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal } = useCart();

  // Group items by restaurant (safely handling null menu_items)
  const groupedItems = cartItems.reduce(
    (acc, item) => {
      const restaurantId = item.menu_items?.restaurant_id || 'unknown';
      if (!restaurantId) return acc;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          items: [],
          restaurantName: "Restaurant",
        };
      }
      acc[restaurantId].items.push(item);
      return acc;
    },
    {} as Record<string, { items: typeof cartItems; restaurantName: string }>,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Mon panier</h1>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-none shadow-soft rounded-3xl">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Mon panier</h1>
          </div>
          <Card className="text-center border-none shadow-soft rounded-2xl overflow-hidden">
            <CardContent className="py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">Votre panier est vide</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Parcourez nos restaurants et ajoutez vos plats préférés
              </p>
              <Button onClick={() => navigate("/restaurants")} className="rounded-full px-6">
                Explorer les restaurants
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = 1500; // Placeholder, will be calculated at checkout
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col pb-40 md:pb-0 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Mon panier</h1>
          <span className="ml-auto text-xs text-muted-foreground">{cartItems.length} article(s)</span>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item, index) => (
            <Card
              key={item.id}
              className="border-none shadow-soft rounded-3xl overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0">
                    <LazyImage
                      src={item.menu_items?.image_url || "/placeholder.svg"}
                      alt={item.menu_items?.name || "Item"}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-base line-clamp-1">{item.menu_items?.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-primary text-lg">
                        {(Number(item.menu_items?.price) * item.quantity).toFixed(0)} FCFA
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-background"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-background"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add More Items CTA */}
        <Button
          variant="outline"
          className="w-full rounded-xl border-dashed h-10 mb-6 text-sm"
          onClick={() => navigate("/restaurants")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter d'autres articles
        </Button>

        {/* Order Summary - Desktop */}
        <Card className="border-none shadow-soft rounded-2xl overflow-hidden hidden md:block">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Résumé de la commande</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{subtotal.toFixed(0)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>{deliveryFee.toFixed(0)} FCFA</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-primary">{total.toFixed(0)} FCFA</span>
              </div>
            </div>
            <Button className="w-full mt-4 h-10 rounded-xl text-sm" onClick={() => navigate("/checkout")}>
              Passer la commande
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Fixed Bottom CTA - Mobile */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 p-3 md:hidden z-40">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-semibold text-primary">{total.toFixed(0)} FCFA</p>
          </div>
        </div>
        <Button className="w-full h-10 rounded-xl text-sm" onClick={() => navigate("/checkout")}>
          Commander maintenant
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
