import { useState, useEffect } from "react";
import { User, Phone, MapPin, Mail, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ButtonLoader } from "@/components/ui/loading-spinner";

export function DriverProfileTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
        });
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Mon profil</h2>

      {/* Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-12 w-12 text-secondary-foreground" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              value={profile.full_name}
              onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="pl-10"
              placeholder="Votre nom"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="pl-10"
              placeholder="+242..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
              className="pl-10"
              placeholder="Votre adresse"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              value={profile.city}
              onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
              className="pl-10"
              placeholder="Brazzaville / Pointe-Noire"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full touch-target"
        >
          {loading ? <ButtonLoader /> : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </Card>

      {/* Email info */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}