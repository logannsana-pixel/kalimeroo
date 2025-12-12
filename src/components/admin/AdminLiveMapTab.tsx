import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Map, Truck, Package, RefreshCw, MapPin, Clock, Navigation
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom driver icon
const createDriverIcon = (isDelivering: boolean) => L.divIcon({
  className: 'custom-driver-marker',
  html: `
    <div class="relative">
      <div class="w-10 h-10 rounded-full ${isDelivering ? 'bg-primary' : 'bg-success'} shadow-lg flex items-center justify-center border-2 border-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
      ${isDelivering ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full animate-pulse border border-white"></div>' : ''}
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Restaurant icon
const restaurantIcon = L.divIcon({
  className: 'custom-restaurant-marker',
  html: `
    <div class="w-8 h-8 rounded-full bg-orange-500 shadow-lg flex items-center justify-center border-2 border-white">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Destination icon
const destinationIcon = L.divIcon({
  className: 'custom-destination-marker',
  html: `
    <div class="w-8 h-8 rounded-full bg-destructive shadow-lg flex items-center justify-center border-2 border-white">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface ActiveOrder {
  id: string;
  status: string;
  delivery_address: string;
  restaurant_id: string;
  delivery_driver_id: string | null;
  restaurant?: { name: string; address: string; latitude?: number; longitude?: number };
  driver?: { full_name: string | null; latitude?: number; longitude?: number; location_updated_at?: string };
  created_at: string;
}

interface ActiveDriver {
  id: string;
  full_name: string | null;
  is_available: boolean;
  phone: string | null;
  latitude?: number;
  longitude?: number;
  location_updated_at?: string;
  current_order?: string;
}

// Component to handle map center updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function AdminLiveMapTab() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-4.2634, 15.2429]); // Brazzaville default

  const fetchLiveData = useCallback(async () => {
    try {
      // Fetch active orders (not delivered or cancelled)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, status, delivery_address, created_at, delivery_driver_id, restaurant_id,
          restaurant:restaurants(name, address, latitude, longitude)
        `)
        .not("status", "in", "(delivered,cancelled)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get driver info for orders with location data
      const ordersWithDrivers = await Promise.all((orders || []).map(async (order: any) => {
        if (order.delivery_driver_id) {
          const { data: driver } = await supabase
            .from("profiles")
            .select("full_name, latitude, longitude, location_updated_at")
            .eq("id", order.delivery_driver_id)
            .maybeSingle();
          return { ...order, driver };
        }
        return order;
      }));

      setActiveOrders(ordersWithDrivers);

      // Fetch available drivers with locations
      const { data: driverRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "delivery_driver");

      if (driverRoles && driverRoles.length > 0) {
        const { data: drivers } = await supabase
          .from("profiles")
          .select("id, full_name, is_available, phone, latitude, longitude, location_updated_at")
          .in("id", driverRoles.map(r => r.user_id))
          .eq("is_validated", true);

        // Map orders to drivers
        const driversWithOrders = (drivers || []).map(driver => {
          const order = (orders as any[])?.find(o => o.delivery_driver_id === driver.id);
          return { ...driver, current_order: order?.id };
        });

        setActiveDrivers(driversWithOrders);
      }
    } catch (error) {
      console.error("Error fetching live data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();

    // Subscribe to real-time updates for orders
    const ordersChannel = supabase
      .channel('admin-live-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchLiveData();
      })
      .subscribe();

    // Subscribe to real-time driver location updates
    const driversChannel = supabase
      .channel('admin-driver-locations')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: 'latitude=neq.null'
      }, (payload) => {
        // Update driver location in real-time
        setActiveDrivers(prev => prev.map(driver => 
          driver.id === payload.new.id 
            ? { 
                ...driver, 
                latitude: payload.new.latitude as number, 
                longitude: payload.new.longitude as number,
                location_updated_at: payload.new.location_updated_at as string
              }
            : driver
        ));
        
        // Also update orders with this driver
        setActiveOrders(prev => prev.map(order => 
          order.delivery_driver_id === payload.new.id
            ? { 
                ...order, 
                driver: { 
                  ...order.driver, 
                  latitude: payload.new.latitude as number, 
                  longitude: payload.new.longitude as number,
                  location_updated_at: payload.new.location_updated_at as string
                }
              }
            : order
        ));
      })
      .subscribe();

    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30s

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(driversChannel);
      clearInterval(interval);
    };
  }, [fetchLiveData]);

  const getStatusInfo = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-500' },
      accepted: { label: 'Acceptée', color: 'bg-blue-500' },
      preparing: { label: 'Préparation', color: 'bg-orange-500' },
      pickup_pending: { label: 'Prêt', color: 'bg-purple-500' },
      pickup_accepted: { label: 'Livreur assigné', color: 'bg-indigo-500' },
      picked_up: { label: 'Récupérée', color: 'bg-cyan-500' },
      delivering: { label: 'En livraison', color: 'bg-primary' },
    };
    return config[status] || { label: status, color: 'bg-muted' };
  };

  const deliveringOrders = activeOrders.filter(o => 
    ['delivering', 'picked_up', 'pickup_accepted'].includes(o.status)
  );

  // Get drivers with valid locations for the map
  const driversWithLocation = activeDrivers.filter(d => d.latitude && d.longitude);

  // Focus on selected order's driver
  useEffect(() => {
    if (selectedOrder) {
      const order = activeOrders.find(o => o.id === selectedOrder);
      if (order?.driver?.latitude && order?.driver?.longitude) {
        setMapCenter([order.driver.latitude, order.driver.longitude]);
      }
    }
  }, [selectedOrder, activeOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carte Live</h2>
          <p className="text-muted-foreground">
            {activeOrders.length} commandes actives • {activeDrivers.filter(d => d.is_available).length} livreurs disponibles
          </p>
        </div>
        <Button variant="outline" onClick={fetchLiveData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Commandes actives</p>
                <p className="text-2xl font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">En livraison</p>
                <p className="text-2xl font-bold">{deliveringOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">GPS actifs</p>
                <p className="text-2xl font-bold">{driversWithLocation.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">En attente livreur</p>
                <p className="text-2xl font-bold">
                  {activeOrders.filter(o => o.status === 'pickup_pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Carte des livraisons
              {driversWithLocation.length > 0 && (
                <Badge variant="outline" className="ml-2 text-success">
                  <span className="w-2 h-2 bg-success rounded-full mr-1 animate-pulse"></span>
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-xl overflow-hidden border">
              <MapContainer
                center={mapCenter}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapCenter} />
                
                {/* Driver markers */}
                {driversWithLocation.map(driver => (
                  <Marker
                    key={driver.id}
                    position={[driver.latitude!, driver.longitude!]}
                    icon={createDriverIcon(!!driver.current_order)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[150px]">
                        <p className="font-bold">{driver.full_name || 'Livreur'}</p>
                        <p className="text-sm text-muted-foreground">
                          {driver.current_order ? 'En livraison' : 'Disponible'}
                        </p>
                        {driver.location_updated_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Màj: {format(new Date(driver.location_updated_at), "HH:mm:ss", { locale: fr })}
                          </p>
                        )}
                        {driver.phone && (
                          <a href={`tel:${driver.phone}`} className="text-xs text-primary hover:underline">
                            {driver.phone}
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Restaurant markers for active orders */}
                {activeOrders
                  .filter(o => o.restaurant?.latitude && o.restaurant?.longitude)
                  .map(order => (
                    <Marker
                      key={`restaurant-${order.id}`}
                      position={[order.restaurant!.latitude!, order.restaurant!.longitude!]}
                      icon={restaurantIcon}
                    >
                      <Popup>
                        <div className="p-2 min-w-[150px]">
                          <p className="font-bold">{order.restaurant?.name}</p>
                          <p className="text-sm text-muted-foreground">{order.restaurant?.address}</p>
                          <Badge className={`mt-1 ${getStatusInfo(order.status).color} text-white text-xs`}>
                            {getStatusInfo(order.status).label}
                          </Badge>
                        </div>
                      </Popup>
                    </Marker>
                  ))
                }
              </MapContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span>Livreur en course</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success"></div>
                <span>Livreur disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span>Restaurant</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes actives</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commande active
                </p>
              ) : (
                activeOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  const hasDriverLocation = order.driver?.latitude && order.driver?.longitude;
                  return (
                    <div 
                      key={order.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedOrder === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono font-bold text-sm">#{order.id.slice(0, 8)}</span>
                        <div className="flex items-center gap-1">
                          {hasDriverLocation && (
                            <Badge variant="outline" className="text-success text-xs">
                              <Navigation className="w-3 h-3 mr-1" />
                              GPS
                            </Badge>
                          )}
                          <Badge className={`${status.color} text-white text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.restaurant?.name || 'Restaurant'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                      {order.driver && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Truck className="w-3 h-3" />
                          <span>{order.driver.full_name || 'Livreur assigné'}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Drivers */}
      <Card>
        <CardHeader>
          <CardTitle>Livreurs en activité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeDrivers.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-8">
                Aucun livreur actif
              </p>
            ) : (
              activeDrivers.map((driver) => {
                const hasLocation = driver.latitude && driver.longitude;
                return (
                  <div 
                    key={driver.id}
                    className={`p-4 rounded-xl border text-center ${
                      driver.is_available && !driver.current_order
                        ? 'border-success/50 bg-success/5'
                        : driver.current_order
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-muted'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center relative ${
                      driver.is_available ? 'bg-success/20' : 'bg-muted'
                    }`}>
                      <Truck className={`w-6 h-6 ${
                        driver.is_available ? 'text-success' : 'text-muted-foreground'
                      }`} />
                      {hasLocation && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Navigation className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium mt-2 truncate">{driver.full_name || 'Livreur'}</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-1 text-xs ${
                        driver.current_order
                          ? 'text-primary'
                          : driver.is_available
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {driver.current_order
                        ? 'En livraison'
                        : driver.is_available
                        ? 'Disponible'
                        : 'Hors ligne'}
                    </Badge>
                    {driver.location_updated_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(driver.location_updated_at), "HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom marker styles */}
      <style>{`
        .custom-driver-marker, .custom-restaurant-marker, .custom-destination-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-driver-marker > div, .custom-restaurant-marker > div, .custom-destination-marker > div {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
