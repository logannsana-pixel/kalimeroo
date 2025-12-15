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
    <div className="p-4 space-y-5">
      {/* Active Deliveries - Priority */}
      {activeOrders.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Livraison en cours
          </h2>
          <div className="space-y-2">
            {activeOrders.map((order) => (
              <Card 
                key={order.id} 
                className="border-none shadow-soft rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => onViewActive(order)}
              >
                <div className="p-3 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          {order.status === 'pickup_accepted' && 'Vers resto'}
                          {order.status === 'picked_up' && 'En livraison'}
                          {order.status === 'delivering' && 'Arrivée'}
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm truncate">{order.restaurants?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {order.delivery_address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-primary">{order.total.toFixed(0)} F</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Available Orders */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Commandes disponibles
          {availableOrders.length > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">{availableOrders.length}</Badge>
          )}
        </h2>
        
        {availableOrders.length === 0 ? (
          <Card className="border-none shadow-soft rounded-2xl">
            <div className="p-6 text-center">
              <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Aucune commande disponible</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Restez en ligne pour recevoir des commandes</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {availableOrders.map((order) => (
              <Card key={order.id} className="border-none shadow-soft rounded-2xl overflow-hidden">
                <div className="p-3 space-y-3">
                  {/* Restaurant */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {order.restaurants?.name?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.restaurants?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.restaurants?.address}
                      </p>
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="flex items-start gap-2 pl-2 border-l-2 border-dashed border-primary/30 ml-4">
                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Livrer à</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.delivery_address}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{order.total.toFixed(0)} F</span>
                      <Button 
                        onClick={() => onAccept(order.id)}
                        disabled={actionLoading === order.id}
                        size="sm"
                        className="h-9 rounded-xl"
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