import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LogOut, Mail, Phone, MapPin, ChevronLeft, Camera, Shield, Moon, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  useDocumentTitle("Mon profil");
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [formData, setFormData] = useState({
    full_name: '', phone: '', address: '', city: '', district: '', avatar_url: ''
  });

  useEffect(() => { fetchProfile(); fetchOrderCount(); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormData({ full_name: data.full_name || '', phone: data.phone || '', address: data.address || '', city: data.city || '', district: data.district || '', avatar_url: data.avatar_url || '' });
      }
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const fetchOrderCount = async () => {
    if (!user) return;
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    setOrderCount(count || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let avatarUrl = formData.avatar_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('restaurant-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('restaurant-images').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...formData, avatar_url: avatarUrl || null, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Profil mis à jour");
      fetchProfile();
    } catch (error) { console.error('Error:', error); toast.error("Erreur lors de la mise à jour"); }
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle('dark', enabled);
    localStorage.setItem('kalimero_dark_mode', enabled ? 'true' : 'false');
  };

  const completionPercent = (() => {
    let filled = 0;
    const fields = [formData.full_name, formData.phone, formData.city, formData.district, formData.address, formData.avatar_url];
    fields.forEach(f => { if (f) filled++; });
    return Math.round((filled / fields.length) * 100);
  })();

  const roleLabel = userRole === 'customer' ? 'Client' : userRole === 'restaurant_owner' ? 'Restaurateur' : userRole === 'delivery_driver' ? 'Livreur' : 'Utilisateur';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 bg-background">
        <div className="bg-gradient-to-b from-primary/20 to-background pt-12 pb-8 px-4 text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-3" />
          <Skeleton className="h-5 w-32 mx-auto mb-1" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="px-4 space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-primary/15 to-background relative">
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="pt-12 pb-6 px-4 text-center">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border-4 border-background shadow-md">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
              )}
            </div>
          </div>
          <h1 className="text-lg font-bold">{formData.full_name || "Utilisateur"}</h1>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{roleLabel}</span>
          <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{orderCount}</strong> commandes</span>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 max-w-lg mx-auto w-full space-y-4">
        {/* Profile Completion */}
        {completionPercent < 100 && (
          <div className="bg-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Profil complété</span>
              <span className="text-xs text-primary font-semibold">{completionPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        )}

        {/* Personal Info */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Informations</h3>

          <ImageUpload label="Photo de profil" onImageChange={setImageFile} currentImage={formData.avatar_url} />

          <div className="space-y-1">
            <Label className="text-xs">Nom complet</Label>
            <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} placeholder="Votre nom" className="h-9 rounded-lg text-sm" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="06 XXX XX XX" className="h-9 pl-9 rounded-lg text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ville</Label>
              <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Brazzaville" className="h-9 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quartier</Label>
              <Input value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} placeholder="Moungali" className="h-9 rounded-lg text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Adresse</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Numéro, rue, repères..." rows={2} className="pl-9 rounded-lg resize-none text-sm" />
            </div>
          </div>

          <Button type="submit" className="w-full h-9 rounded-xl text-sm">Enregistrer</Button>
        </form>

        {/* Preferences */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Préférences</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Mode sombre</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>

        {/* Role-specific links */}
        {userRole === 'restaurant_owner' && (
          <button onClick={() => navigate('/restaurant-dashboard')} className="w-full bg-card rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Dashboard Restaurant</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        {userRole === 'delivery_driver' && (
          <button onClick={() => navigate('/delivery-dashboard')} className="w-full bg-card rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Dashboard Livreur</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Security */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Sécurité</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span>{user?.email}</span>
          </div>
          <button onClick={signOut} className="w-full py-2 text-sm text-destructive font-medium hover:bg-destructive/5 rounded-lg transition-colors">
            Déconnexion
          </button>
        </div>
      </main>

      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
