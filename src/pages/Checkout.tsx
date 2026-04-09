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
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";

const steps = [
  { label: "Adresse", icon: "📍" },
  { label: "Contact", icon: "📱" },
  { label: "Options", icon: "🎛️" },
  { label: "Confirmation", icon: "✅" },
];

export default function Checkout() {
  useDocumentTitle("Finaliser la commande | Kalimero");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, refreshCart } = useCart();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);

  useEffect(() => { if (!user) setShowGuestModal(true); }, [user]);
  useEffect(() => {
    if (user) {
      supabase.from("loyalty_points").select("points").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data) setAvailablePoints(data.points); });
    }
  }, [user]);

  const handleGuestAuthSuccess = () => { setShowGuestModal(false); refreshCart(); };
  const restaurantId = cartItems[0]?.menu_items?.restaurant_id;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (restaurantId && user) {
        try {
          const { data } = await supabase.from("restaurants").select("delivery_fee").eq("id", restaurantId).maybeSingle();
          if (data) setDeliveryFee(Number(data.delivery_fee) || 0);
        } catch (error) { console.error('Error:', error); }
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

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center pb-20">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl mb-4">🎉</motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-accent" />
        </motion.div>
        <h1 className="text-xl font-bold mb-2">Commande confirmée !</h1>
        <p className="text-sm text-muted-foreground mb-1">Commande #{orderId?.slice(0, 8)}</p>
        <p className="text-sm text-muted-foreground mb-6">Temps estimé : 25-35 min</p>
        <button onClick={() => navigate("/orders")} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium text-sm transition-all active:scale-95">
          Suivre ma commande
        </button>
        <BottomNav />
      </div>
    );
  }

  const pointsDiscount = usePoints ? Math.min(availablePoints, getCartTotal()) : 0;

  const handleSubmit = async (checkoutData: any) => {
    try {
      const subtotal = getCartTotal();
      const total = subtotal + deliveryFee - discount - pointsDiscount;
      const fullAddress = `${checkoutData.city || ''} - ${checkoutData.district || ''}${checkoutData.addressComplement ? `, ${checkoutData.addressComplement}` : ""}`.replace(/^[\s-]+/, '');

      const { data: order, error: orderError } = await supabase.from("orders").insert({
        user_id: user!.id, restaurant_id: restaurantId, phone: checkoutData.phone,
        delivery_address: fullAddress || checkoutData.address, notes: checkoutData.notes,
        subtotal, delivery_fee: deliveryFee, promo_code_id: promoCodeId || null,
        discount_amount: discount + pointsDiscount, total, status: "pending",
        voice_note_url: checkoutData.voiceNoteUrl || null,
      }).select().single();
      if (orderError) throw orderError;

      if (promoCodeId) {
        try {
          const { data: promo } = await supabase.from("promo_codes").select("uses_count").eq("id", promoCodeId).single();
          if (promo) await supabase.from("promo_codes").update({ uses_count: (promo.uses_count || 0) + 1 }).eq("id", promoCodeId);
        } catch {}
      }

      const orderItems = cartItems.map(item => ({
        order_id: order.id, menu_item_id: item.menu_item_id, quantity: item.quantity,
        price: item.menu_items.price, selected_options: item.selected_options || []
      }));
      await supabase.from("order_items").insert(orderItems);

      // Deduct loyalty points if used
      if (pointsDiscount > 0) {
        await supabase.from("loyalty_points").update({ points: availablePoints - pointsDiscount }).eq("user_id", user!.id);
      }

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
  const total = subtotal + deliveryFee - discount - pointsDiscount;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/cart")} className="w-8 h-8 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-semibold">Finaliser la commande</span>
        </header>
        <AddressCaptureModal />
        {user ? (
          <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
            <div className="flex gap-2">
              {[{ icon: ShieldCheck, label: "Paiement sécurisé" }, { icon: Truck, label: "Livraison rapide" }, { icon: Clock, label: "Suivi en temps réel" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl">
                  <Icon className="w-5 h-5 text-primary mb-1" /><span className="text-[10px] text-center">{label}</span>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Votre commande</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-2 text-xs">
                    <img src={item.menu_items?.image_url || "/placeholder.svg"} alt={item.menu_items?.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" width={40} height={40} />
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
                {pointsDiscount > 0 && <div className="flex justify-between text-accent"><span>⭐ Points</span><span>-{pointsDiscount.toLocaleString('fr-FR')} F</span></div>}
                <div className="flex justify-between text-sm font-semibold pt-2"><span>Total</span><span className="text-primary">{total.toLocaleString('fr-FR')} F</span></div>
              </div>
            </div>

            {/* Loyalty Points */}
            {availablePoints > 0 && (
              <div className="bg-card rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium">⭐ Utiliser mes {availablePoints} points (-{Math.min(availablePoints, subtotal).toLocaleString('fr-FR')} F)</span>
                  <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                </label>
              </div>
            )}

            <div className="bg-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Code promo</h3>
              <PromoCodeInput subtotal={subtotal} onPromoApplied={(discountAmount, promoId) => { setDiscount(discountAmount); setPromoCodeId(promoId); }} />
            </div>
            <CheckoutSteps cartItems={cartItems} subtotal={subtotal} deliveryFee={deliveryFee} discount={discount} total={total} onSubmit={handleSubmit} />
          </main>
        ) : (
          <div className="text-center py-12"><p className="text-sm text-muted-foreground">Connectez-vous pour continuer</p></div>
        )}
        <BottomNav />
        <GuestCheckoutModal isOpen={showGuestModal} onClose={() => navigate("/")} onSuccess={handleGuestAuthSuccess} />
      </div>
    </PageTransition>
  );
}
