import { MapPin, Clock, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DriverHomeTabProps {
  availableOrders: DriverOrder[];
  activeOrders: DriverOrder[];
  onAccept: (orderId: string) => void;
  onViewActive: (order: DriverOrder) => void;
  actionLoading: string | null;
}

export function DriverHomeTab({ 
  availableOrders, 
  activeOrders, 
  onAccept, 
  onViewActive,
  actionLoading 
}: DriverHomeTabProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Active Deliveries - Priority */}
      {activeOrders.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Livraison en cours
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Card 
                key={order.id} 
                className="p-4 border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewActive(order)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="status-active text-xs">
                        {order.status === 'pickup_accepted' && 'Vers resto'}
                        {order.status === 'picked_up' && 'En livraison'}
                        {order.status === 'delivering' && 'Arrivée'}
                      </Badge>
                    </div>
                    <p className="font-semibold truncate">{order.restaurants?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {order.delivery_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{order.total.toFixed(0)} F</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Available Orders */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Commandes disponibles
          {availableOrders.length > 0 && (
            <Badge className="bg-primary text-primary-foreground">{availableOrders.length}</Badge>
          )}
        </h2>
        
        {availableOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Aucune commande disponible</p>
            <p className="text-sm text-muted-foreground mt-1">Restez en ligne pour recevoir des commandes</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  {/* Restaurant */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-secondary-foreground font-bold text-sm">
                        {order.restaurants?.name?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{order.restaurants?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.restaurants?.address}
                      </p>
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="flex items-start gap-3 pl-2 border-l-2 border-dashed border-muted ml-4">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Livrer à</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.delivery_address}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{order.total.toFixed(0)} F</span>
                      <Button 
                        onClick={() => onAccept(order.id)}
                        disabled={actionLoading === order.id}
                        className="touch-target"
                      >
                        {actionLoading === order.id ? <ButtonLoader /> : 'Accepter'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}