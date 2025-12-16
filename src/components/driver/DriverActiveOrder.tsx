import { lazy, Suspense, useState, useEffect } from "react";
import { ArrowLeft, Phone, MapPin, MessageCircle, Navigation, CheckCircle, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatInterface } from "@/components/ChatInterface";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Lazy load map for performance
const OrderTrackingMap = lazy(() => import("@/components/tracking/OrderTrackingMap"));

interface DriverActiveOrderProps {
  order: DriverOrder;
  onBack: () => void;
  onPickup: () => void;
  onComplete: () => void;
  actionLoading: string | null;
}

const statusSteps = [
  { status: 'pickup_accepted', label: 'Vers restaurant', progress: 25 },
  { status: 'picked_up', label: 'Récupérée', progress: 50 },
  { status: 'delivering', label: 'En livraison', progress: 75 },
  { status: 'delivered', label: 'Livrée', progress: 100 },
];

export function DriverActiveOrder({ 
  order, 
  onBack, 
  onPickup, 
  onComplete,
  actionLoading 
}: DriverActiveOrderProps) {
  const { user } = useAuth();
  const currentStep = statusSteps.find(s => s.status === order.status) || statusSteps[0];
  const isLoading = actionLoading === order.id;
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Enable GPS tracking for active deliveries
  useDriverLocation({
    orderId: order.id,
    enabled: ['pickup_accepted', 'picked_up', 'delivering'].includes(order.status),
    updateInterval: 5000 // Update every 5 seconds
  });

  // Fetch current driver location from profile
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user) return;
      
      try {
        // Get driver's current location
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.latitude && profile?.longitude) {
          setDriverLocation({ lat: profile.latitude, lng: profile.longitude });
        }

        // Get restaurant location by restaurant_id from the order
        if (order.restaurant_id) {
          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('latitude, longitude')
            .eq('id', order.restaurant_id)
            .maybeSingle();
          
          if (restaurant?.latitude && restaurant?.longitude) {
            setRestaurantLocation({ lat: restaurant.latitude, lng: restaurant.longitude });
          }
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setMapError('Impossible de charger les positions');
      }
    };
    
    fetchLocations();

    // Subscribe to profile updates for real-time location
    if (!user?.id) return;

    const channel = supabase
      .channel(`driver-location-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        const data = payload.new as any;
        if (data.latitude && data.longitude) {
          setDriverLocation({ lat: data.latitude, lng: data.longitude });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, order.restaurant_id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b safe-area-top">
        <div className="px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="touch-target">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-semibold">Commande #{order.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">{currentStep.label}</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 py-3 bg-muted/50">
        <Progress value={currentStep.progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Resto</span>
          <span>Récupérée</span>
          <span>Client</span>
          <span>Livrée</span>
        </div>
      </div>

      <main className="flex-1 p-4 space-y-4 pb-32">
        {/* Live Map */}
        <div className="rounded-2xl overflow-hidden">
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
            <OrderTrackingMap
              orderId={order.id}
              driverLocation={driverLocation}
              restaurantLocation={restaurantLocation}
              customerLocation={null}
              status={order.status}
              estimatedTime="15-20 min"
            />
          </Suspense>
        </div>

        {/* Restaurant info */}
        <Card className={`p-4 ${order.status === 'pickup_accepted' ? 'border-2 border-primary' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Package className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restaurant</p>
              <p className="font-semibold">{order.restaurants?.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{order.restaurants?.address}</span>
          </div>
          <div className="flex gap-2">
            {order.restaurants?.phone && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={`tel:${order.restaurants.phone}`}>
                  <Phone className="h-4 w-4 mr-1" /> Appeler
                </a>
              </Button>
            )}
            {order.restaurants?.owner_id && (
              <ChatInterface
                orderId={order.id}
                receiverId={order.restaurants.owner_id}
                receiverName="Restaurant"
              />
            )}
          </div>
        </Card>

        {/* Customer info */}
        <Card className={`p-4 ${order.status === 'picked_up' || order.status === 'delivering' ? 'border-2 border-primary' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-semibold">{order.profiles?.full_name || 'Client'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{order.delivery_address}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={`tel:${order.phone}`}>
                <Phone className="h-4 w-4 mr-1" /> Appeler
              </a>
            </Button>
            <ChatInterface
              orderId={order.id}
              receiverId={order.user_id}
              receiverName={order.profiles?.full_name || "Client"}
            />
          </div>
        </Card>

        {/* Order details */}
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-1">Montant</p>
          <p className="text-lg font-bold">{order.total.toFixed(0)} FCFA</p>
        </Card>
      </main>

      {/* Fixed action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-bottom">
        {order.status === 'pickup_accepted' && (
          <Button 
            onClick={onPickup} 
            disabled={isLoading}
            className="w-full h-11 text-sm font-medium"
          >
            {isLoading ? <ButtonLoader /> : (
              <>
                <Package className="h-4 w-4 mr-1.5" />
                J'ai récupéré la commande
              </>
            )}
          </Button>
        )}
        {(order.status === 'picked_up' || order.status === 'delivering') && (
          <Button 
            onClick={onComplete} 
            disabled={isLoading}
            className="w-full h-11 text-sm font-medium bg-primary"
          >
            {isLoading ? <ButtonLoader /> : (
              <>
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Marquer comme livrée
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}