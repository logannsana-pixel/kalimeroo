import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, LogOut, Mail, Phone, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RestaurantProfileTab } from "@/components/restaurant/RestaurantProfileTab";
import { DeliveryProfileTab } from "@/components/delivery/DeliveryProfileTab";
import { ImageUpload } from "@/components/ImageUpload";

export default function Profile() {
  const { user, userRole, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    avatar_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          district: data.district || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Profil mis à jour avec succès");
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="text-center py-8">Chargement...</div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold">Mon profil</h1>
          <Button 
            variant="outline" 
            onClick={signOut}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <ImageUpload
                    label="Photo de profil"
                    onImageChange={setImageFile}
                    currentImage={formData.avatar_url}
                  />

                  <div>
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Votre nom complet"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+242 06 123 4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Brazzaville"
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">Quartier</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      placeholder="Moungali"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse complète</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Numéro, rue, repères..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Enregistrer les modifications
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific sections */}
          {userRole === "restaurant_owner" && <RestaurantProfileTab />}
          {userRole === "delivery_driver" && <DeliveryProfileTab />}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
