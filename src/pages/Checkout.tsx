import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, Truck, Clock, CheckCircle } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Adresse", icon: "📍" },
  { label: "Contact", icon: "📱" },
  { label: "Options", icon: "🎛️" },
  { label: "Confirmation", icon: "✅" },
];

export default function Checkout() {
  useDocumentTitle("Finaliser la commande");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, refreshCart } = useCart();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => { if (!user) setShowGuestModal(true); }, [user]);

  const handleGuestAuthSuccess = () => { setShowGuestModal(false); refreshCart(); };

  const restaurantId = cartItems[0]?.menu_items?.restaurant_id;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (restaurantId && user) {
        try {
          const { data } = await supabase.from("restaurants").select("delivery_fee").eq("id", restaurantId).maybeSingle();
          if (data) setDeliveryFee(Number(data.delivery_fee) || 0);
        } catch (error) {
          console.error('Error fetching delivery fee:', error);
        }
      }
    };
    fetchDeliveryFee();
  }, [restaurantId, user]);

  if (!user && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <GuestCheckoutModal isOpen={showGuestModal} onClose={() => navigate("/")} onSuccess={handleGuestAuthSuccess} />
      </div>
    );
  }

  if (user && cartItems.length === 0 && !orderSuccess) { navigate("/cart"); return null; }

  // Success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center pb-20">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-sm text-muted-foreground mb-1">Commande #{orderId?.slice(0, 8)}</p>
        <p className="text-sm text-muted-foreground mb-6">Temps estimé : 25-35 min</p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium text-sm"
        >
          Suivre ma commande
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleSubmit = async (checkoutData: any) => {
    try {
      const subtotal = getCartTotal();
      const total = subtotal + deliveryFee - discount;
      const fullAddress = `${checkoutData.city || ''} - ${checkoutData.district || ''}${checkoutData.addressComplement ? `, ${checkoutData.addressComplement}` : ""}`.replace(/^[\s-]+/, '');

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: user!.id,
        restaurant_id: restaurantId,
        phone: checkoutData.phone,
        delivery_address: fullAddress || checkoutData.address,
        notes: checkoutData.notes,
        subtotal,
        delivery_fee: deliveryFee,
        promo_code_id: promoCodeId || null,
        discount_amount: discount,
        total,
        status: "pending",
        voice_note_url: checkoutData.voiceNoteUrl || null,
      }).select().single();

      if (orderError) throw orderError;

      if (promoCodeId) {
        const { data: promo } = await supabase.from("promo_codes").select("uses_count").eq("id", promoCodeId).single();
        if (promo) await supabase.from("promo_codes").update({ uses_count: (promo.uses_count || 0) + 1 }).eq("id", promoCodeId);
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items.price,
        selected_options: item.selected_options || []
      }));
      await supabase.from("order_items").insert(orderItems);
      await clearCart();

      setOrderId(order.id);
      setOrderSuccess(true);
      toast.success("Commande passée avec succès !");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la commande");
    }
  };

  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/cart")} className="w-8 h-8 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">Finaliser la commande</span>
      </header>

      <AddressCaptureModal />

      {user ? (
        <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
          {/* Trust Badges */}
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary mb-1" />
              <span className="text-[10px] text-center">Paiement sécurisé</span>
            </div>
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <Truck className="w-5 h-5 text-primary mb-1" />
              <span className="text-[10px] text-center">Livraison rapide</span>
            </div>
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <Clock className="w-5 h-5 text-primary mb-1" />
              <span className="text-[10px] text-center">Suivi en temps réel</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Votre commande</h3>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-2 text-xs">
                  <img src={item.menu_items?.image_url || "/placeholder.svg"} alt={item.menu_items?.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.menu_items?.name}</p>
                    <p className="text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="font-medium">{(Number(item.menu_items?.price) * item.quantity).toLocaleString('fr-FR')} F</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/30 pt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toLocaleString('fr-FR')} F</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{deliveryFee.toLocaleString('fr-FR')} F</span></div>
              {discount > 0 && <div className="flex justify-between text-accent"><span>Réduction</span><span>-{discount.toLocaleString('fr-FR')} F</span></div>}
              <div className="flex justify-between text-sm font-semibold pt-2"><span>Total</span><span className="text-primary">{total.toLocaleString('fr-FR')} F</span></div>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Code promo</h3>
            <PromoCodeInput subtotal={subtotal} onPromoApplied={(discountAmount, promoId) => { setDiscount(discountAmount); setPromoCodeId(promoId); }} />
          </div>

          {/* Checkout Steps */}
          <CheckoutSteps cartItems={cartItems} subtotal={subtotal} deliveryFee={deliveryFee} discount={discount} total={total} onSubmit={handleSubmit} />
        </main>
      ) : (
        <div className="text-center py-12"><p className="text-sm text-muted-foreground">Connectez-vous pour continuer</p></div>
      )}

      <BottomNav />
      <GuestCheckoutModal isOpen={showGuestModal} onClose={() => navigate("/")} onSuccess={handleGuestAuthSuccess} />
    </div>
  );
}
