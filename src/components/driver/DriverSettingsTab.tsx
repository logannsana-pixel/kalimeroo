import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Settings, 
  Bell, 
  MapPin, 
  Shield, 
  Moon, 
  Volume2, 
  Vibrate,
  ChevronRight,
  LogOut,
  Loader2,
  Navigation
} from "lucide-react";

interface DriverSettingsTabProps {
  onLogout: () => void;
}

export function DriverSettingsTab({ onLogout }: DriverSettingsTabProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    soundAlerts: true,
    vibration: true,
    darkMode: false,
    autoAccept: false,
    gpsTracking: true
  });
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Load current location from profile
    const fetchLocation = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();
      
      if (data?.latitude && data?.longitude) {
        setCurrentLocation({ lat: data.latitude, lng: data.longitude });
      }
    };
    fetchLocation();
  }, [user]);

  const captureGPS = async () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée");
      return;
    }

    setGpsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({
              latitude: lat,
              longitude: lng,
              location_updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (error) {
            toast.error("Erreur de sauvegarde");
          } else {
            setCurrentLocation({ lat, lng });
            toast.success("Position mise à jour");
          }
        }
        setGpsCapturing(false);
      },
      (error) => {
        console.error('GPS error:', error);
        toast.error("Impossible d'obtenir la position");
        setGpsCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold">Paramètres</h2>

      {/* GPS Location */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Ma position GPS</p>
            <p className="text-sm text-muted-foreground">
              {currentLocation 
                ? `📍 ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : 'Position non définie'
              }
            </p>
          </div>
        </div>
        <Button 
          onClick={captureGPS} 
          disabled={gpsCapturing}
          className="w-full h-12 text-base font-semibold"
        >
          {gpsCapturing ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Capture en cours...</>
          ) : (
            <><MapPin className="h-5 w-5 mr-2" /> Capturer ma position</>
          )}
        </Button>
      </Card>

      {/* Notifications */}
      <Card className="divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-muted-foreground">Recevoir les alertes</p>
            </div>
          </div>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, notifications: checked }))}
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Sons</p>
              <p className="text-sm text-muted-foreground">Alertes sonores</p>
            </div>
          </div>
          <Switch
            checked={settings.soundAlerts}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, soundAlerts: checked }))}
          />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Vibration</p>
              <p className="text-sm text-muted-foreground">Vibrer pour les alertes</p>
            </div>
          </div>
          <Switch
            checked={settings.vibration}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, vibration: checked }))}
          />
        </div>
      </Card>

      {/* GPS Tracking */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Suivi GPS en temps réel</p>
            <p className="text-sm text-muted-foreground">Partager ma position pendant les livraisons</p>
          </div>
        </div>
        <Switch
          checked={settings.gpsTracking}
          onCheckedChange={(checked) => setSettings(s => ({ ...s, gpsTracking: checked }))}
        />
      </Card>

      {/* Version & Logout */}
      <Card className="divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium">Version</p>
          </div>
          <Badge variant="secondary">1.0.0</Badge>
        </div>

        <button 
          onClick={onLogout}
          className="w-full p-4 flex items-center justify-between text-destructive hover:bg-destructive/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <p className="font-medium">Déconnexion</p>
          </div>
          <ChevronRight className="h-5 w-5" />
        </button>
      </Card>
    </div>
  );
}
