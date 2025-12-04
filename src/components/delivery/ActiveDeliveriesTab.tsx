import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Store, CheckCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { ChatInterface } from "@/components/ChatInterface";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  user_id: string;
  restaurants: {
    name: string;
    address: string;
    phone: string | null;
    owner_id: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

interface ActiveDeliveriesTabProps {
  orders: Order[];
  onComplete: (orderId: string) => void;
}

export const ActiveDeliveriesTab = ({ orders, onComplete }: ActiveDeliveriesTabProps) => {
  const activeDeliveries = orders.filter(o => o.status === 'delivering');

  if (activeDeliveries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Aucune livraison en cours</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeDeliveries.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">Livraison #{order.id.slice(0, 8)}</CardTitle>
              <Badge>En cours</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{order.restaurants?.name}</p>
                  <p className="text-muted-foreground">{order.restaurants?.address}</p>
                  {order.restaurants?.phone && (
                    <p className="text-muted-foreground">{order.restaurants.phone}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{order.profiles?.full_name || 'Client'}</p>
                    <p className="text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2 ml-6">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{order.phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <ChatInterface
                  orderId={order.id}
                  receiverId={order.user_id}
                  receiverName={order.profiles?.full_name || "Client"}
                />
                {order.restaurants?.owner_id && (
                  <ChatInterface
                    orderId={order.id}
                    receiverId={order.restaurants.owner_id}
                    receiverName={order.restaurants.name}
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-semibold text-lg">{order.total.toFixed(2)} FCFA</span>
                <Button onClick={() => onComplete(order.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme livrée
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
