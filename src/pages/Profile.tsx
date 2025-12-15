import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-lg font-semibold">Mon profil</h1>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Card */}
          <Card className="border-none shadow-soft rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email / Téléphone</p>
                    <p className="font-medium text-sm">{user?.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <ImageUpload
                    label="Photo de profil"
                    onImageChange={setImageFile}
                    currentImage={formData.avatar_url}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Votre nom complet"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="06 XXX XX XX"
                        className="h-12 pl-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">Ville</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="Brazzaville"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-sm font-medium">Quartier</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                        placeholder="Moungali"
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">Adresse complète</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="Numéro, rue, repères..."
                        rows={3}
                        className="pl-10 rounded-xl resize-none"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-2xl btn-playful">
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
      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
