import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const driverIcon = createCustomIcon('#FF8A00', '🛵');
const restaurantIcon = createCustomIcon('#22c55e', '🍽️');
const customerIcon = createCustomIcon('#3b82f6', '📍');

interface OrderTrackingMapProps {
  orderId: string;
  driverLocation?: { lat: number; lng: number } | null;
  restaurantLocation?: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  status: string;
  driverName?: string;
  driverPhone?: string;
  estimatedTime?: string;
}

// Component to auto-fit bounds
const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

// Component to animate driver marker
const AnimatedDriverMarker: React.FC<{ 
  position: [number, number]; 
  previousPosition: [number, number] | null;
}> = ({ position }) => {
  return (
    <Marker position={position} icon={driverIcon}>
      <Popup>
        <div className="text-center">
          <span className="font-semibold">🛵 Livreur en route</span>
        </div>
      </Popup>
    </Marker>
  );
};

export const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  orderId,
  driverLocation: initialDriverLocation,
  restaurantLocation,
  customerLocation,
  status,
  driverName,
  driverPhone,
  estimatedTime
}) => {
  const [driverLocation, setDriverLocation] = useState(initialDriverLocation);
  const [previousDriverLocation, setPreviousDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  // Subscribe to real-time driver location updates
  useEffect(() => {
    console.log('Setting up real-time tracking for order:', orderId);
    
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order update received:', payload);
          const newData = payload.new as any;
          if (newData.driver_latitude && newData.driver_longitude) {
            setPreviousDriverLocation(driverLocation);
            setDriverLocation({
              lat: newData.driver_latitude,
              lng: newData.driver_longitude
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up tracking subscription');
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Fetch route from OpenRouteService (free)
  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLocation || !customerLocation) return;

      try {
        // Using OpenRouteService public API (limited but free)
        const start = `${driverLocation.lng},${driverLocation.lat}`;
        const end = `${customerLocation.lng},${customerLocation.lat}`;
        
        // For now, create a simple straight line route
        // OpenRouteService requires API key for full routing
        setRoute([
          [driverLocation.lat, driverLocation.lng],
          [customerLocation.lat, customerLocation.lng]
        ]);
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, [driverLocation, customerLocation]);

  // Calculate bounds for the map
  const getBounds = (): L.LatLngBoundsExpression => {
    const points: [number, number][] = [];
    if (driverLocation) points.push([driverLocation.lat, driverLocation.lng]);
    if (restaurantLocation) points.push([restaurantLocation.lat, restaurantLocation.lng]);
    if (customerLocation) points.push([customerLocation.lat, customerLocation.lng]);
    
    if (points.length === 0) {
      // Default to Brazzaville
      return [[-4.2634, 15.2429], [-4.2634, 15.2429]];
    }
    
    return points as L.LatLngBoundsExpression;
  };

  // Default center (Brazzaville)
  const defaultCenter: [number, number] = [-4.2634, 15.2429];
  const center = driverLocation 
    ? [driverLocation.lat, driverLocation.lng] as [number, number]
    : customerLocation 
      ? [customerLocation.lat, customerLocation.lng] as [number, number]
      : defaultCenter;

  const statusConfig: Record<string, { label: string; color: string }> = {
    'pending': { label: 'En attente', color: 'bg-yellow-500' },
    'accepted': { label: 'Acceptée', color: 'bg-blue-500' },
    'preparing': { label: 'En préparation', color: 'bg-orange-500' },
    'pickup_pending': { label: 'Prête', color: 'bg-purple-500' },
    'pickup_accepted': { label: 'Livreur en route', color: 'bg-indigo-500' },
    'picked_up': { label: 'Récupérée', color: 'bg-cyan-500' },
    'delivering': { label: 'En livraison', color: 'bg-primary' },
    'delivered': { label: 'Livrée', color: 'bg-green-500' },
    'cancelled': { label: 'Annulée', color: 'bg-red-500' },
  };

  const currentStatus = statusConfig[status] || { label: status, color: 'bg-muted' };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${currentStatus.color} text-white px-3 py-1`}>
              {currentStatus.label}
            </Badge>
            {estimatedTime && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{estimatedTime}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Driver Info */}
        {driverName && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                🛵
              </div>
              <div>
                <p className="font-medium text-sm">{driverName}</p>
                <p className="text-xs text-muted-foreground">Votre livreur</p>
              </div>
            </div>
            {driverPhone && (
              <a 
                href={`tel:${driverPhone}`}
                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-lg h-[300px] md:h-[400px]">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds bounds={getBounds()} />
          
          {/* Route line */}
          {route.length > 1 && (
            <Polyline 
              positions={route}
              color="#FF8A00"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
          
          {/* Restaurant marker */}
          {restaurantLocation && (
            <Marker 
              position={[restaurantLocation.lat, restaurantLocation.lng]} 
              icon={restaurantIcon}
            >
              <Popup>
                <span className="font-semibold">🍽️ Restaurant</span>
              </Popup>
            </Marker>
          )}
          
          {/* Customer marker */}
          {customerLocation && (
            <Marker 
              position={[customerLocation.lat, customerLocation.lng]} 
              icon={customerIcon}
            >
              <Popup>
                <span className="font-semibold">📍 Votre position</span>
              </Popup>
            </Marker>
          )}
          
          {/* Driver marker */}
          {driverLocation && (
            <AnimatedDriverMarker 
              position={[driverLocation.lat, driverLocation.lng]}
              previousPosition={previousDriverLocation ? [previousDriverLocation.lat, previousDriverLocation.lng] : null}
            />
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛵</span>
          <span className="text-muted-foreground">Livreur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          <span className="text-muted-foreground">Restaurant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <span className="text-muted-foreground">Vous</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;
