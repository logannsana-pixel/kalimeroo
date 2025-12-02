import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { PromoCodeInput } from "@/components/PromoCodeInput";
import { GuestCheckoutModal } from "@/components/checkout/GuestCheckoutModal";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart, refreshCart } = useCart();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Show modal for non-authenticated users instead of redirecting
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
        const { data } = await supabase
          .from("restaurants")
          .select("delivery_fee")
          .eq("id", restaurantId)
          .single();

        if (data) {
          setDeliveryFee(Number(data.delivery_fee));
        }
      }
    };

    fetchDeliveryFee();
  }, [restaurantId, user]);

  // If no user and no cart items, redirect to home
  if (!user && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <GuestCheckoutModal
            isOpen={showGuestModal}
            onClose={() => navigate("/")}
            onSuccess={handleGuestAuthSuccess}
          />
        </main>
        <Footer />
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

      // Create order
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

      // Update promo code usage
      if (promoCodeId) {
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("uses_count")
          .eq("id", promoCodeId)
          .single();
        
        if (promo) {
          await supabase
            .from("promo_codes")
            .update({ uses_count: promo.uses_count + 1 })
            .eq("id", promoCodeId);
        }
      }

      // Create order items with selected options
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items.price,
        selected_options: item.selected_options || [],
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
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
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8 text-center md:text-left">
          Finaliser la commande
        </h1>

        {user ? (
          <>
            <div className="max-w-2xl mx-auto mb-6">
              <PromoCodeInput 
                subtotal={subtotal} 
                onPromoApplied={(discountAmount, promoId) => {
                  setDiscount(discountAmount);
                  setPromoCodeId(promoId);
                }} 
              />
            </div>

            <CheckoutSteps
              cartItems={cartItems}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              discount={discount}
              total={total}
              onSubmit={handleSubmit}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Connectez-vous pour finaliser votre commande</p>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
      
      <GuestCheckoutModal
        isOpen={showGuestModal}
        onClose={() => navigate("/")}
        onSuccess={handleGuestAuthSuccess}
      />
    </div>
  );
}
