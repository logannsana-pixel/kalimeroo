import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Store, Package } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  restaurants: {
    name: string;
    address: string;
    phone: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

interface AvailableOrdersTabProps {
  orders: Order[];
  onAccept: (orderId: string) => void;
}

export const AvailableOrdersTab = ({ orders, onAccept }: AvailableOrdersTabProps) => {
  const availableOrders = orders.filter(o => o.status === 'preparing');

  if (availableOrders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Aucune commande disponible pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {availableOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">Commande #{order.id.slice(0, 8)}</CardTitle>
              <Badge variant="secondary">
                <Package className="w-3 h-3 mr-1" />
                Disponible
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Store className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{order.restaurants?.name}</p>
                  <p className="text-muted-foreground">{order.restaurants?.address}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Livrer à: {order.delivery_address}</p>
                    <p className="text-muted-foreground">{order.profiles?.full_name || 'Client'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2 ml-6">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{order.phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-semibold text-lg">{order.total.toFixed(2)} FCFA</span>
                <Button onClick={() => onAccept(order.id)}>
                  Accepter la livraison
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
