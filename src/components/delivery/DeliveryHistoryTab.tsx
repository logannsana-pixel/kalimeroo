import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  restaurants: {
    name: string;
  } | null;
}

interface DeliveryHistoryTabProps {
  orders: Order[];
}

export const DeliveryHistoryTab = ({ orders }: DeliveryHistoryTabProps) => {
  const completedOrders = orders.filter(o => o.status === 'delivered');

  if (completedOrders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Aucune livraison effectuée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {completedOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">Livraison #{order.id.slice(0, 8)}</CardTitle>
              <Badge>Livrée</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{order.delivery_address}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Restaurant: {order.restaurants?.name}
              </p>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">{order.total.toFixed(2)} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
