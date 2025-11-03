import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "cod">("cod");
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    notes: "",
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  // Get restaurant from first cart item
  const restaurantId = cartItems[0]?.menu_items.restaurant_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get restaurant delivery fee
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("delivery_fee")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      const subtotal = getCartTotal();
      const deliveryFee = Number(restaurant.delivery_fee);
      const total = subtotal + deliveryFee;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          phone: formData.phone,
          delivery_address: formData.address,
          notes: formData.notes,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_items.price,
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
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Finaliser la commande</h1>

        <form onSubmit={handleSubmit}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Delivery Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse de livraison *</Label>
                    <Textarea
                      id="address"
                      placeholder="Entrez votre adresse complète"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      required
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Instructions spéciales (optionnel)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Instructions pour le livreur..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mode de paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(value as "mobile_money" | "cod")
                    }
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Paiement à la livraison</div>
                        <div className="text-sm text-muted-foreground">
                          Payez en espèces lors de la livraison
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="mobile_money" id="mobile_money" />
                      <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Mobile Money</div>
                        <div className="text-sm text-muted-foreground">
                          Orange Money, MTN Mobile Money, Moov Money
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.menu_items.name} x{item.quantity}
                        </span>
                        <span>
                          {(Number(item.menu_items.price) * item.quantity).toFixed(0)} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(0)} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>Calculé à la prochaine étape</span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      "Confirmer la commande"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
