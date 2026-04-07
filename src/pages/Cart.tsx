import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ChevronLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/LazyImage";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Cart() {
  useDocumentTitle("Mon panier");
  const navigate = useNavigate();
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Mon panier</h1>
        </header>
        <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 bg-card rounded-2xl">
              <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Mon panier</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-6xl mb-4 animate-bounce">🛒</div>
          <h3 className="text-xl font-bold mb-2">Votre panier est vide</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
            Explorez nos restaurants et ajoutez vos plats préférés
          </p>
          <Button onClick={() => navigate("/home")} className="rounded-full px-6 h-11">
            Découvrir les restaurants
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    );
  }

  const subtotal = getCartTotal();
  const itemCount = getCartCount();

  return (
    <div className="min-h-screen flex flex-col pb-40 md:pb-0 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Mon panier</h1>
        </div>
        <span className="text-xs text-muted-foreground">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 p-3 bg-card rounded-2xl shadow-sm"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <LazyImage
                  src={item.menu_items?.image_url || "/placeholder.svg"}
                  alt={item.menu_items?.name || "Item"}
                  className="w-full h-full"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.menu_items?.name}</h3>
                  <button
                    className="text-muted-foreground hover:text-destructive p-1 -mr-1"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Options */}
                {item.selected_options && item.selected_options.length > 0 && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {item.selected_options.map((o: any) => o.option_name).join(', ')}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary text-sm">
                    {(Number(item.menu_items?.price) * item.quantity).toLocaleString('fr-FR')} F
                  </span>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-0 border border-primary/30 rounded-full">
                    <button
                      className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary/5 rounded-l-full"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-semibold text-xs text-primary">{item.quantity}</span>
                    <button
                      className="w-7 h-7 flex items-center justify-center text-primary hover:bg-primary/5 rounded-r-full"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add More Items */}
        <button
          className="w-full py-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors mb-4"
          onClick={() => navigate("/home")}
        >
          <Plus className="inline w-3.5 h-3.5 mr-1" />
          Ajouter d'autres articles
        </button>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl p-4 space-y-2">
          <h3 className="font-semibold text-sm mb-3">Résumé</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{subtotal.toLocaleString('fr-FR')} F</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span className="italic text-muted-foreground text-xs">Calculés au checkout</span>
          </div>
          <div className="border-t border-border/30 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-sm">Total estimé</span>
            <span className="font-bold text-primary">{subtotal.toLocaleString('fr-FR')} F</span>
          </div>
        </div>

        {/* Desktop CTA */}
        <Button className="w-full mt-4 h-11 rounded-xl text-sm hidden md:flex" onClick={() => navigate("/checkout")}>
          Passer commande · {subtotal.toLocaleString('fr-FR')} F
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </main>

      {/* Fixed Bottom CTA - Mobile */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 p-3 md:hidden z-40 safe-area-bottom">
        <Button className="w-full h-12 rounded-xl text-sm font-medium" onClick={() => navigate("/checkout")}>
          Passer commande · {subtotal.toLocaleString('fr-FR')} FCFA
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
