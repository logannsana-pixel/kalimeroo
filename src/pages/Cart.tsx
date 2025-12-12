import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { HorizontalCard, HorizontalCardSkeleton } from "@/components/ui/horizontal-card";

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon panier</h1>
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <HorizontalCardSkeleton key={i} variant="default" />
            ))}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon panier</h1>
          <div className="max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="py-12 md:py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Panier vide</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  Votre panier est vide. Explorez nos restaurants pour ajouter des plats !
                </p>
                <Button onClick={() => navigate("/restaurants")} size="lg" className="rounded-full">
                  Découvrir les restaurants
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const subtotal = getCartTotal();

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon panier</h1>
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="relative">
                <HorizontalCard
                  imageUrl={item.menu_items.image_url}
                  title={item.menu_items.name}
                  price={Number(item.menu_items.price)}
                  showQuantity={true}
                  quantity={item.quantity}
                  onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                  onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                  variant="default"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span>Sous-total</span>
                  <span className="font-bold text-primary">{subtotal.toFixed(0)} FCFA</span>
                </div>
                <Button
                  className="w-full rounded-full"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Passer la commande
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => navigate("/restaurants")}
                >
                  Continuer mes achats
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
