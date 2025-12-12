import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Map, Truck, Package, RefreshCw, MapPin, Clock, Navigation, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ActiveOrder {
  id: string;
  status: string;
  delivery_address: string;
  restaurant_id: string;
  user_id: string;
  delivery_driver_id: string | null;
  restaurant?: { name: string; address: string; latitude?: number; longitude?: number };
  driver?: { full_name: string | null; latitude?: number; longitude?: number; location_updated_at?: string };
  customer?: { full_name: string | null; latitude?: number; longitude?: number; phone?: string | null };
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

export function AdminLiveMapTab() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -4.2634, lng: 15.2429 }); // Brazzaville
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const fetchLiveData = useCallback(async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, status, delivery_address, created_at, delivery_driver_id, restaurant_id, user_id,
          restaurant:restaurants(name, address, latitude, longitude)
        `)
        .not("status", "in", "(delivered,cancelled)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all((orders || []).map(async (order: any) => {
        let driver = null;
        if (order.delivery_driver_id) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, latitude, longitude, location_updated_at")
            .eq("id", order.delivery_driver_id)
            .maybeSingle();
          driver = data;
        }

        const { data: customer } = await supabase
          .from("profiles")
          .select("full_name, phone, latitude, longitude")
          .eq("id", order.user_id)
          .maybeSingle();

        return { ...order, driver, customer };
      }));

      setActiveOrders(ordersWithDetails);

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

  const recenterMap = useCallback(async () => {
    if (!mapInstanceRef.current || markersRef.current.length === 0) return;

    const L = await import("leaflet");
    const latlngs = markersRef.current
      .map((marker) => (typeof marker.getLatLng === "function" ? marker.getLatLng() : null))
      .filter(Boolean);

    if (!latlngs.length) return;

    const bounds = L.latLngBounds(latlngs as any);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current) return;

      const L = await import("leaflet");

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add driver markers
      activeDrivers.forEach(driver => {
        if (driver.latitude && driver.longitude) {
          const isDelivering = !!driver.current_order;
          
          const icon = L.divIcon({
            className: 'custom-driver-marker',
            html: `
              <div style="position: relative;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isDelivering ? 'hsl(var(--primary))' : 'hsl(var(--success))'}; box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; border: 2px solid white;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                    <path d="M15 18H9"/>
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                    <circle cx="17" cy="18" r="2"/>
                    <circle cx="7" cy="18" r="2"/>
                  </svg>
                </div>
                ${isDelivering ? '<div style="position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; background: hsl(var(--warning)); border-radius: 50%; border: 2px solid white; animation: pulse 2s infinite;"></div>' : ''}
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          });

          const marker = L.marker([driver.latitude, driver.longitude], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="min-width: 150px; padding: 8px;">
                <p style="font-weight: bold; margin: 0;">${driver.full_name || 'Livreur'}</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0;">${isDelivering ? 'En livraison' : 'Disponible'}</p>
                ${driver.location_updated_at ? `<p style="font-size: 11px; color: #999;">Màj: ${format(new Date(driver.location_updated_at), "HH:mm:ss", { locale: fr })}</p>` : ''}
                ${driver.phone ? `<a href="tel:${driver.phone}" style="font-size: 12px; color: hsl(var(--primary));">${driver.phone}</a>` : ''}
              </div>
            `);
          
          markersRef.current.push(marker);
        }
      });

      // Add restaurant markers for active orders
      activeOrders.forEach(order => {
        if (order.restaurant?.latitude && order.restaurant?.longitude) {
          const icon = L.divIcon({
            className: 'custom-restaurant-marker',
            html: `
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #f97316; box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; border: 2px solid white;">
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

          const marker = L.marker([order.restaurant.latitude, order.restaurant.longitude], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="min-width: 150px; padding: 8px;">
                <p style="font-weight: bold; margin: 0;">${order.restaurant.name}</p>
                <p style="font-size: 12px; color: #666; margin: 4px 0;">${order.restaurant.address}</p>
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${getStatusColor(order.status)}; color: white;">
                  ${getStatusLabel(order.status)}
                </span>
              </div>
            `);
          
          markersRef.current.push(marker);
        }
      });

      // If we have drivers with locations, fit bounds
      const driversWithLocation = activeDrivers.filter(d => d.latitude && d.longitude);
      if (driversWithLocation.length > 0) {
        const bounds = L.latLngBounds(
          driversWithLocation.map(d => [d.latitude!, d.longitude!] as [number, number])
        );
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    };

    updateMarkers();
  }, [activeDrivers, activeOrders]);

  useEffect(() => {
    fetchLiveData();

    const ordersChannel = supabase
      .channel('admin-live-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchLiveData();
      })
      .subscribe();

    const driversChannel = supabase
      .channel('admin-driver-locations')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles'
      }, (payload) => {
        if (payload.new.latitude && payload.new.longitude) {
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
        }
      })
      .subscribe();

    const interval = setInterval(fetchLiveData, 30000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(driversChannel);
      clearInterval(interval);
    };
  }, [fetchLiveData]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      preparing: 'Préparation',
      pickup_pending: 'Prêt',
      pickup_accepted: 'Livreur assigné',
      picked_up: 'Récupérée',
      delivering: 'En livraison',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#eab308',
      accepted: '#3b82f6',
      preparing: '#f97316',
      pickup_pending: '#a855f7',
      pickup_accepted: '#6366f1',
      picked_up: '#06b6d4',
      delivering: 'hsl(var(--primary))',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusInfo = (status: string) => ({
    label: getStatusLabel(status),
    color: getStatusColor(status)
  });

  const deliveringOrders = activeOrders.filter(o => 
    ['delivering', 'picked_up', 'pickup_accepted'].includes(o.status)
  );

  const driversWithLocation = activeDrivers.filter(d => d.latitude && d.longitude);

  // Focus on selected order's driver
  useEffect(() => {
    if (selectedOrder && mapInstanceRef.current) {
      const order = activeOrders.find(o => o.id === selectedOrder);
      if (order?.driver?.latitude && order?.driver?.longitude) {
        mapInstanceRef.current.setView([order.driver.latitude, order.driver.longitude], 15);
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
            {activeOrders.length} commandes actives • {activeDrivers.filter((d) => d.is_available).length} livreurs disponibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={recenterMap}>
            <MapPin className="w-4 h-4 mr-2" />
            Centrer la carte
          </Button>
          <Button variant="outline" onClick={fetchLiveData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
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
            <div 
              ref={mapRef}
              className="h-[500px] rounded-xl overflow-hidden border bg-muted"
            />
            
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
                          <Badge 
                            className="text-white text-xs"
                            style={{ backgroundColor: status.color }}
                          >
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

      {/* Custom styles for markers */}
      <style>{`
        .custom-driver-marker, .custom-restaurant-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
