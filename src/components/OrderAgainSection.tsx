import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, ArrowRight, Plus } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  restaurant_name: string;
  restaurant_id: string;
}

export const OrderAgainSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id,
          restaurant_id,
          restaurants (name),
          order_items (
            menu_item_id,
            menu_items (id, name, image_url, price)
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(5);

      if (orders) {
        const recentItems: OrderItem[] = [];
        const seenItems = new Set<string>();

        orders.forEach((order: any) => {
          order.order_items?.forEach((item: any) => {
            if (item.menu_items && !seenItems.has(item.menu_items.id)) {
              seenItems.add(item.menu_items.id);
              recentItems.push({
                id: item.menu_items.id,
                name: item.menu_items.name,
                image_url: item.menu_items.image_url,
                price: item.menu_items.price,
                restaurant_name: order.restaurants?.name || "",
                restaurant_id: order.restaurant_id,
              });
            }
          });
        });

        setItems(recentItems.slice(0, 6));
      }
      setLoading(false);
    };

    fetchRecentOrders();
  }, [user]);

  if (!user || (!loading && items.length === 0)) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          Commander à nouveau
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="rounded-full text-primary">
          Historique <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-36 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className="flex-shrink-0 w-36 md:w-40 cursor-pointer overflow-hidden border-none shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in group"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/restaurant/${item.restaurant_id}`)}
            >
              <div className="relative h-24 overflow-hidden">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <button
                  className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/restaurant/${item.restaurant_id}`);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.restaurant_name}</p>
                <p className="text-sm font-bold text-primary mt-1">{item.price.toFixed(0)} FCFA</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
