import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Store, Package, Clock, Truck } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
  actionLoading?: string | null;
}

export const AvailableOrdersTab = ({ orders, onAccept, actionLoading }: AvailableOrdersTabProps) => {
  const availableOrders = orders.filter(o => o.status === 'pickup_pending');

  if (availableOrders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground font-medium">Aucune commande disponible</p>
          <p className="text-sm text-muted-foreground mt-1">Revenez dans quelques instants</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {availableOrders.map((order) => {
        const isLoading = actionLoading === order.id;
        
        return (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Commande #{order.id.slice(0, 8)}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Package className="w-3 h-3 mr-1" />
                  Disponible
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Restaurant */}
                <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                  <Store className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{order.restaurants?.name}</p>
                    <p className="text-muted-foreground">{order.restaurants?.address}</p>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Livrer à:</p>
                    <p className="text-muted-foreground">{order.delivery_address}</p>
                    <p className="text-muted-foreground">{order.profiles?.full_name || 'Client'}</p>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-bold text-xl">{order.total.toFixed(0)} FCFA</span>
                  <Button 
                    onClick={() => onAccept(order.id)}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <ButtonLoader />
                        <span className="ml-2">Traitement...</span>
                      </>
                    ) : (
                      "Accepter la livraison"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
