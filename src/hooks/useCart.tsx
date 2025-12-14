import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
  menu_item_id: string;
  selected_options?: any[];
  menu_items: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    restaurant_id: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (menuItemId: string, quantity?: number, selectedOptions?: any[]) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  loading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  refreshCart: async () => {},
});

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          quantity,
          menu_item_id,
          menu_items (
            id,
            name,
            price,
            image_url,
            restaurant_id
          )
        `,
        )
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Erreur lors du chargement du panier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (menuItemId: string, quantity: number = 1, selectedOptions: any[] = []) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour ajouter au panier");
      return;
    }

    try {
      // Always add as new item if there are selected options
      if (selectedOptions.length > 0) {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          menu_item_id: menuItemId,
          quantity,
          selected_options: selectedOptions,
        });

        if (error) throw error;
        await fetchCart();
        toast.success("Ajouté au panier");
        return;
      }

      // Check if item already exists in cart (without options)
      const existingItem = cartItems.find((item) => item.menu_item_id === menuItemId);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          menu_item_id: menuItemId,
          quantity,
        });

        if (error) throw error;
        await fetchCart();
        toast.success("Ajouté au panier");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

      if (error) throw error;
      await fetchCart();
      toast.success("Retiré du panier");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);

      if (error) throw error;
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Erreur lors du vidage du panier");
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + Number(item.menu_items.price) * item.quantity,
      // 0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
