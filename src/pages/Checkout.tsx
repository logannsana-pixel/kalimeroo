import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BottomNav } from "@/components/BottomNav";
import { CheckoutSteps, type CheckoutData } from "@/components/checkout/CheckoutSteps";
import { defaultCheckoutSettings, type CheckoutSettings } from "@/lib/checkout-payments";
import { invokePayment } from "@/services/checkoutPayments";
import { Button } from "@/components/ui/button";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { AddressCaptureModal } from "@/components/AddressCaptureModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, Truck, Clock } from "lucide-react";

export default function Checkout() {
  useDocumentTitle("Finaliser la commande");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, refreshCart, loading: cartLoading } = useCart();
  const [settings, setSettings] = useState<CheckoutSettings>(defaultCheckoutSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => { if (!user) setShowGuestModal(true); }, [user]);

  const handleGuestAuthSuccess = () => { setShowGuestModal(false); refreshCart(); };

  const restaurantId = cartItems[0]?.menu_items?.restaurant_id;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (restaurantId && user) {
        try {
          setSettingsLoading(true);
          setSettingsError(false);
          const { data } = await supabase.from("restaurants").select("delivery_fee").eq("id", restaurantId).maybeSingle();
          if (data) setDeliveryFee(Number(data.delivery_fee) || 0);
          const { data: options, error } = await supabase.from("restaurant_checkout_settings").select("*").eq("restaurant_id", restaurantId).maybeSingle();
          if (error) throw error;
          setSettings(options ? { ...options, deposit_type: options.deposit_type as CheckoutSettings["deposit_type"] } : defaultCheckoutSettings);
        } catch (error) {
          setSettingsError(true);
          console.error('Error fetching delivery fee:', error);
        } finally {
          setSettingsLoading(false);
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

  const handleSubmit = async (checkoutData: CheckoutData) => {
    if (!user || !restaurantId || settingsLoading || settingsError) return;
    try {
      const fullAddress = [checkoutData.city, checkoutData.district, checkoutData.address].filter(Boolean).join(" - ");
      const { data: orderId, error: orderError } = await supabase.rpc("create_checkout_order", {
        p_request_id: requestId, p_method: checkoutData.paymentMethod,
        p_phone: checkoutData.phone, p_address: checkoutData.deliveryMode === "pickup" ? "À emporter" : fullAddress,
        p_notes: checkoutData.notes, p_promo_id: promoCodeId || undefined,
        p_pickup: checkoutData.deliveryMode === "pickup", p_voice_url: checkoutData.voiceNoteUrl,
      });
      if (orderError) throw orderError;
      if (checkoutData.paymentMethod !== "cod") {
        try {
          const payment = await invokePayment({ action: "start", order_id: orderId });
          if (payment.url) { window.location.assign(payment.url); return; }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Nyole indisponible. Reprenez le paiement dans vos commandes.");
        }
      } else toast.success("Commande passée !");
      await refreshCart();
      navigate("/orders");
    } catch (error) { console.error("Error:", error); toast.error(error instanceof Error ? error.message : "Erreur lors de la commande"); }
  };

  const subtotal = getCartTotal() ?? 0;
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Retour au panier" onClick={() => navigate("/cart")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium">Checkout</span>
      </header>

      <AddressCaptureModal />

      {user ? (
        <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
          {/* Trust Badges */}
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-center">Paiement sécurisé</span>
            </div>
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <Truck className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-center">Livraison rapide</span>
            </div>
            <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
              <Clock className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-center">Suivi en temps réel</span>
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
                  <span className="font-medium">{(Number(item.menu_items?.price) * item.quantity).toFixed(0)} FC</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/30 pt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{subtotal.toFixed(0)} FC</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{deliveryFee.toFixed(0)} FC</span></div>
              {discount > 0 && <div className="flex justify-between text-green-500"><span>Réduction</span><span>-{discount.toFixed(0)} FC</span></div>}
              <div className="flex justify-between text-sm font-semibold pt-2"><span>Total</span><span className="text-primary">{total.toFixed(0)} FC</span></div>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Code promo</h3>
            <PromoCodeInput subtotal={subtotal} onPromoApplied={(discountAmount, promoId) => { setDiscount(discountAmount); setPromoCodeId(promoId); }} />
          </div>

          {/* Checkout Steps */}
          {settingsError ? <p role="alert" className="text-destructive">Impossible de charger les moyens de paiement. Réessayez plus tard.</p> : cartItems.length === 0 ? <p>{cartLoading ? "Chargement du panier…" : "Votre panier est vide"}</p> : settingsLoading ? <p>Chargement des moyens de paiement…</p> : <CheckoutSteps cartItems={cartItems} subtotal={subtotal} deliveryFee={deliveryFee} discount={discount} total={total} settings={settings} onSubmit={handleSubmit} />}
        </main>
      ) : (
        <div className="text-center py-12"><p className="text-sm text-muted-foreground">Connectez-vous pour continuer</p></div>
      )}

      <BottomNav />
      <GuestCheckoutModal isOpen={showGuestModal} onClose={() => navigate("/")} onSuccess={handleGuestAuthSuccess} />
    </div>
  );
}
