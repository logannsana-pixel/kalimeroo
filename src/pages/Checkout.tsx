import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, Truck, Clock } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, refreshCart } = useCart();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowGuestModal(true);
    }
  }, [user]);

  const handleGuestAuthSuccess = () => {
    setShowGuestModal(false);
    refreshCart();
  };

  const restaurantId = cartItems[0]?.menu_items?.restaurant_id;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (restaurantId && user) {
        const { data } = await supabase.from("restaurants").select("delivery_fee").eq("id", restaurantId).single();

        if (data) {
          setDeliveryFee(Number(data.delivery_fee));
        }
      }
    };

    fetchDeliveryFee();
  }, [restaurantId, user]);

  if (!user && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <GuestCheckoutModal
            isOpen={showGuestModal}
            onClose={() => navigate("/")}
            onSuccess={handleGuestAuthSuccess}
          />
        </main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    );
  }

  if (user && cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  const handleSubmit = async (checkoutData: any) => {
    try {
      const subtotal = getCartTotal();
      const total = subtotal + deliveryFee - discount;

      const fullAddress = `${checkoutData.city} - ${checkoutData.district}${
        checkoutData.addressComplement ? `, ${checkoutData.addressComplement}` : ""
      }`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          phone: checkoutData.phone,
          delivery_address: fullAddress,
          notes: checkoutData.notes,
          subtotal,
          delivery_fee: deliveryFee,
          promo_code_id: promoCodeId || null,
          discount_amount: discount,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (promoCodeId) {
        const { data: promo } = await supabase.from("promo_codes").select("uses_count").eq("id", promoCodeId).single();

        if (promo) {
          await supabase
            .from("promo_codes")
            .update({ uses_count: promo.uses_count + 1 })
            .eq("id", promoCodeId);
        }
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items.price,
        selected_options: item.selected_options || [],
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      await clearCart();

      toast.success("Commande passée avec succès!");
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erreur lors de la création de la commande");
    }
  };

  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/cart")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Finaliser la commande</h1>
        </div>

        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-none shadow-soft rounded-2xl">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Paiement à la livraison</span>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-soft rounded-2xl">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Livraison rapide</span>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-soft rounded-2xl">
                  <CardContent className="p-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Suivi en temps réel</span>
                  </CardContent>
                </Card>
              </div>

              {/* Promo Code */}
              <Card className="border-none shadow-soft rounded-3xl">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-bold mb-4">Code promo</h3>
                  <PromoCodeInput
                    subtotal={subtotal}
                    onPromoApplied={(discountAmount, promoId) => {
                      setDiscount(discountAmount);
                      setPromoCodeId(promoId);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Checkout Steps */}
              <CheckoutSteps
                cartItems={cartItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                discount={discount}
                total={total}
                onSubmit={handleSubmit}
              />
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-none shadow-soft rounded-3xl sticky top-4">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-bold text-lg mb-4">Votre commande</h3>

                  {/* Cart Items Preview */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.menu_items?.image_url || "/placeholder.svg"}
                          alt={item.menu_items?.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.menu_items?.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <span className="font-semibold text-sm">
                          {(Number(item.menu_items?.price) * item.quantity).toFixed(0)} FCFA
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{subtotal.toFixed(0)} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>{deliveryFee.toFixed(0)} FCFA</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction</span>
                        <span>-{discount.toFixed(0)} FCFA</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{total.toFixed(0)} FCFA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Connectez-vous pour finaliser votre commande</p>
          </div>
        )}
      </main>
      <Footer className="hidden md:block" />
      <BottomNav />

      <GuestCheckoutModal isOpen={showGuestModal} onClose={() => navigate("/")} onSuccess={handleGuestAuthSuccess} />
    </div>
  );
}
