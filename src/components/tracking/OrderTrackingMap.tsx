import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Navigation } from "lucide-react";
import { useRoute } from "@/hooks/useRoute";

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

// Local type to avoid importing Leaflet types at top-level
type LeafletModule = typeof import("leaflet");

export const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  orderId,
  driverLocation: initialDriverLocation,
  restaurantLocation,
  customerLocation,
  status,
  driverName,
  driverPhone,
  estimatedTime,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);
  const [driverLocation, setDriverLocation] = useState(initialDriverLocation || null);
  
  const { route, fetchRoute, loading: routeLoading } = useRoute();

  // Met à jour la position du livreur quand la prop change
  useEffect(() => {
    if (initialDriverLocation) {
      setDriverLocation(initialDriverLocation);
    }
  }, [initialDriverLocation]);

  // Abonnement temps réel aux mises à jour de localisation (table profiles)
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const data = payload.new as any;
          if (data.latitude && data.longitude) {
            setDriverLocation({ lat: data.latitude as number, lng: data.longitude as number });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Initialisation de la carte Leaflet (lazy import)
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L: LeafletModule = (await import("leaflet")).default || (await import("leaflet"));
      await import("leaflet/dist/leaflet.css");

      if (!isMounted) return;

      // Fix des icônes par défaut
      // @ts-expect-error – propriété interne de Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      setLeaflet(L);

      const defaultCenter: [number, number] = [-4.2634, 15.2429]; // Brazzaville
      const map = L.map(mapRef.current).setView(defaultCenter, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, []);

  // Fetch real route when locations change
  useEffect(() => {
    if (driverLocation && customerLocation) {
      fetchRoute(driverLocation, customerLocation);
    }
  }, [driverLocation, customerLocation, fetchRoute]);

  // Mise à jour des marqueurs et du tracé
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    const L = leaflet;

    // Nettoyer les anciens marqueurs
    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    const points: [number, number][] = [];

    // Icônes custom avec emojis (comme avant)
    const createCustomIcon = (color: string, emoji: string) =>
      L.divIcon({
        className: "custom-marker",
        html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid white;">${emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

    const driverIcon = createCustomIcon("#FF8A00", "🛵");
    const restaurantIcon = createCustomIcon("#22c55e", "🍽️");
    const customerIcon = createCustomIcon("#3b82f6", "📍");

    // Restaurant
    if (restaurantLocation) {
      const pos: [number, number] = [restaurantLocation.lat, restaurantLocation.lng];
      const marker = L.marker(pos, { icon: restaurantIcon }).bindPopup("🍽️ Restaurant");
      markersLayerRef.current.addLayer(marker);
      points.push(pos);
    }

    // Client
    if (customerLocation) {
      const pos: [number, number] = [customerLocation.lat, customerLocation.lng];
      const marker = L.marker(pos, { icon: customerIcon }).bindPopup("📍 Client");
      markersLayerRef.current.addLayer(marker);
      points.push(pos);
    }

    // Livreur
    if (driverLocation) {
      const pos: [number, number] = [driverLocation.lat, driverLocation.lng];
      const marker = L.marker(pos, { icon: driverIcon }).bindPopup("🛵 Livreur");
      markersLayerRef.current.addLayer(marker);
      points.push(pos);
    }

    // Draw route from OpenRouteService if available
    if (route && route.coordinates && route.coordinates.length > 0) {
      const polyline = L.polyline(route.coordinates as [number, number][], {
        color: "#FF8A00",
        weight: 5,
        opacity: 0.9,
        lineJoin: "round",
      });
      routeLayerRef.current.addLayer(polyline);
    } else if (driverLocation && customerLocation) {
      // Fallback to direct line
      const directLine: [number, number][] = [
        [driverLocation.lat, driverLocation.lng],
        [customerLocation.lat, customerLocation.lng],
      ];
      const polyline = L.polyline(directLine, {
        color: "#FF8A00",
        weight: 4,
        opacity: 0.6,
        dashArray: "10, 10",
      });
      routeLayerRef.current.addLayer(polyline);
    }

    // Ajuster la vue pour englober tous les points
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [leaflet, driverLocation, restaurantLocation, customerLocation, route]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-yellow-500" },
    accepted: { label: "Acceptée", color: "bg-blue-500" },
    preparing: { label: "En préparation", color: "bg-orange-500" },
    pickup_pending: { label: "Prête", color: "bg-purple-500" },
    pickup_accepted: { label: "Livreur en route", color: "bg-indigo-500" },
    picked_up: { label: "Récupérée", color: "bg-cyan-500" },
    delivering: { label: "En livraison", color: "bg-primary" },
    delivered: { label: "Livrée", color: "bg-green-500" },
    cancelled: { label: "Annulée", color: "bg-red-500" },
  };

  const currentStatus = statusConfig[status] || { label: status, color: "bg-muted" };

  return (
    <div className="space-y-4">
      {/* En-tête statut */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${currentStatus.color} text-white px-3 py-1`}>
              {currentStatus.label}
            </Badge>
            {route && route.duration > 0 ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Navigation className="h-4 w-4" />
                <span>{route.distance} km</span>
                <span className="mx-1">•</span>
                <Clock className="h-4 w-4" />
                <span>~{route.duration} min</span>
              </div>
            ) : estimatedTime ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{estimatedTime}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Infos livreur */}
        {driverName && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span role="img" aria-label="Livreur">
                  🛵
                </span>
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

      {/* Carte */}
      <div className="rounded-2xl overflow-hidden shadow-lg h-[300px] md:h-[400px] bg-muted">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Légende */}
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
          <span className="text-muted-foreground">Client</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;
