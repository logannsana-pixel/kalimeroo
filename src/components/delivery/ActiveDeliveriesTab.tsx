import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Store, CheckCircle, Package, Navigation } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { ChatInterface } from "@/components/ChatInterface";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";

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
  onPickup: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  actionLoading?: string | null;
}

const statusConfig: Record<string, { label: string; progress: number; color: string }> = {
  pickup_accepted: { label: "En route vers le restaurant", progress: 25, color: "bg-blue-500" },
  picked_up: { label: "Commande récupérée", progress: 50, color: "bg-orange-500" },
  delivering: { label: "En livraison", progress: 75, color: "bg-green-500" },
};

export const ActiveDeliveriesTab = ({ orders, onPickup, onComplete, actionLoading }: ActiveDeliveriesTabProps) => {
  const activeDeliveries = orders.filter(o => ['pickup_accepted', 'picked_up', 'delivering'].includes(o.status));

  if (activeDeliveries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground font-medium">Aucune livraison en cours</p>
          <p className="text-sm text-muted-foreground mt-1">Consultez les commandes disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeDeliveries.map((order) => {
        const config = statusConfig[order.status] || statusConfig.delivering;
        const isLoading = actionLoading === order.id;
        
        return (
          <Card key={order.id} className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Livraison #{order.id.slice(0, 8)}</CardTitle>
                <Badge className={config.color}>{config.label}</Badge>
              </div>
              <Progress value={config.progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Restaurant info - highlighted when going to pickup */}
                <div className={`flex items-start gap-3 p-3 rounded-lg ${order.status === 'pickup_accepted' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                  <Store className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{order.restaurants?.name}</p>
                    <p className="text-sm text-muted-foreground">{order.restaurants?.address}</p>
                    {order.restaurants?.phone && (
                      <a href={`tel:${order.restaurants.phone}`} className="text-sm text-primary flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {order.restaurants.phone}
                      </a>
                    )}
                  </div>
                  {order.status === 'pickup_accepted' && (
                    <Navigation className="w-5 h-5 text-primary animate-pulse" />
                  )}
                </div>

                {/* Customer info - highlighted when delivering */}
                <div className={`flex items-start gap-3 p-3 rounded-lg ${['picked_up', 'delivering'].includes(order.status) ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{order.profiles?.full_name || 'Client'}</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                    <a href={`tel:${order.phone}`} className="text-sm text-primary flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {order.phone}
                    </a>
                  </div>
                  {['picked_up', 'delivering'].includes(order.status) && (
                    <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
                  )}
                </div>

                {/* Chat buttons */}
                <div className="flex flex-wrap gap-2">
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

                {/* Main action button - prominent and clear */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">{order.total.toFixed(0)} FCFA</span>
                  </div>
                  
                  {order.status === 'pickup_accepted' && (
                    <Button 
                      onClick={() => onPickup(order.id)} 
                      className="w-full h-14 text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ButtonLoader />
                          <span className="ml-2">Traitement...</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-5 h-5 mr-2" />
                          J'ai récupéré la commande
                        </>
                      )}
                    </Button>
                  )}
                  
                  {['picked_up', 'delivering'].includes(order.status) && (
                    <Button 
                      onClick={() => onComplete(order.id)}
                      className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ButtonLoader />
                          <span className="ml-2">Traitement...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Marquer comme livrée
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
