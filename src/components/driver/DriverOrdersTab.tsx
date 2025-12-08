import { Package, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DriverOrdersTabProps {
  orders: DriverOrder[];
}

export function DriverOrdersTab({ orders }: DriverOrdersTabProps) {
  // Group by date
  const groupedOrders = orders.reduce((acc, order) => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(order);
    return acc;
  }, {} as Record<string, DriverOrder[]>);

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Historique des livraisons</h2>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Aucune livraison terminée</p>
        </Card>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {format(new Date(date), 'EEEE d MMMM', { locale: fr })}
            </p>
            <div className="space-y-2">
              {groupedOrders[date].map((order) => (
                <Card key={order.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.restaurants?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.total.toFixed(0)} F</p>
                      <Badge className="status-success text-xs">Livrée</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}