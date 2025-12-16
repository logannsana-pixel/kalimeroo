import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Megaphone, Plus, Edit, Trash2, Tag, Percent, Calendar, Store,
  Image, Bell, Star, Eye, MousePointer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses_count: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  restaurant_id: string | null;
  restaurant_name?: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  background_color: string;
  position: string;
  is_active: boolean;
  click_count: number;
  view_count: number;
}

interface Popup {
  id: string;
  title: string;
  content: string | null;
  popup_type: string;
  is_active: boolean;
  display_count: number;
  click_count: number;
}

interface SponsoredRestaurant {
  id: string;
  name: string;
  is_sponsored: boolean;
  sponsored_until: string | null;
}

export function AdminMarketingTab() {
  const [activeSubTab, setActiveSubTab] = useState("promos");
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [restaurants, setRestaurants] = useState<SponsoredRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_uses: null as number | null,
    valid_until: "",
  });
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    background_color: "#FF8A00",
    position: "top"
  });
  const [popupForm, setPopupForm] = useState({
    title: "",
    content: "",
    popup_type: "promo",
    button_text: "OK"
  });
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === "promos") {
        const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
        const codesWithRestaurants = await Promise.all((data || []).map(async (code) => {
          if (code.restaurant_id) {
            const { data: restaurant } = await supabase.from("restaurants").select("name").eq("id", code.restaurant_id).maybeSingle();
            return { ...code, restaurant_name: restaurant?.name };
          }
          return code;
        }));
        setPromoCodes(codesWithRestaurants);
      } else if (activeSubTab === "banners") {
        const { data } = await supabase.from("marketing_banners").select("*").order("display_order");
        setBanners(data || []);
      } else if (activeSubTab === "popups") {
        const { data } = await supabase.from("marketing_popups").select("*").order("created_at", { ascending: false });
        setPopups(data || []);
      } else if (activeSubTab === "sponsored") {
        const { data } = await supabase.from("restaurants").select("id, name, is_sponsored, sponsored_until").order("name");
        setRestaurants(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePromoActive = async (promo: PromoCode) => {
    const { error } = await supabase.from("promo_codes").update({ is_active: !promo.is_active }).eq("id", promo.id);
    if (!error) { toast.success("Mis à jour"); fetchData(); }
  };

  const createPromoCode = async () => {
    if (!formData.code.trim()) { toast.error("Code requis"); return; }
    const { error } = await supabase.from("promo_codes").insert({
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_amount: formData.min_order_amount || null,
      max_uses: formData.max_uses || null,
      valid_from: new Date().toISOString(),
      valid_until: new Date(formData.valid_until || Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    });
    if (error?.code === '23505') { toast.error("Code existe déjà"); }
    else if (error) { toast.error("Erreur"); }
    else { toast.success("Créé"); setShowCreateModal(false); fetchData(); }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from(table as any).delete().eq("id", id);
    toast.success("Supprimé");
    fetchData();
  };

  const toggleBanner = async (id: string, current: boolean) => {
    await supabase.from("marketing_banners").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const togglePopup = async (id: string, current: boolean) => {
    await supabase.from("marketing_popups").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const toggleSponsored = async (id: string, current: boolean) => {
    const updates: any = { is_sponsored: !current };
    if (!current) {
      const oneMonth = new Date();
      oneMonth.setMonth(oneMonth.getMonth() + 1);
      updates.sponsored_until = oneMonth.toISOString();
    } else {
      updates.sponsored_until = null;
    }
    await supabase.from("restaurants").update(updates).eq("id", id);
    toast.success(current ? "Sponsoring retiré" : "Restaurant sponsorisé");
    fetchData();
  };

  const createBanner = async () => {
    if (!bannerForm.title) { toast.error("Titre requis"); return; }
    await supabase.from("marketing_banners").insert([bannerForm]);
    toast.success("Bannière créée");
    setShowBannerModal(false);
    setBannerForm({ title: "", subtitle: "", image_url: "", background_color: "#FF8A00", position: "top" });
    fetchData();
  };

  const createPopup = async () => {
    if (!popupForm.title) { toast.error("Titre requis"); return; }
    await supabase.from("marketing_popups").insert([popupForm]);
    toast.success("Popup créé");
    setShowPopupModal(false);
    setPopupForm({ title: "", content: "", popup_type: "promo", button_text: "OK" });
    fetchData();
  };

  const activePromos = promoCodes.filter(p => p.is_active && new Date(p.valid_until) > new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Marketing</h2>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="promos" className="text-xs"><Tag className="h-3 w-3 mr-1" />Promos</TabsTrigger>
          <TabsTrigger value="banners" className="text-xs"><Image className="h-3 w-3 mr-1" />Bannières</TabsTrigger>
          <TabsTrigger value="popups" className="text-xs"><Bell className="h-3 w-3 mr-1" />Popups</TabsTrigger>
          <TabsTrigger value="sponsored" className="text-xs"><Star className="h-3 w-3 mr-1" />Sponsorisés</TabsTrigger>
        </TabsList>

        {/* Promo Codes Tab */}
        <TabsContent value="promos" className="mt-4">
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <Badge variant="secondary">{promoCodes.length} total</Badge>
              <Badge className="bg-green-500">{activePromos.length} actifs</Badge>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" />Nouveau code
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                    <TableCell>{promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `${promo.discount_value} F`}</TableCell>
                    <TableCell>{promo.uses_count || 0}{promo.max_uses ? `/${promo.max_uses}` : ''}</TableCell>
                    <TableCell>{format(new Date(promo.valid_until), "d MMM", { locale: fr })}</TableCell>
                    <TableCell><Switch checked={promo.is_active} onCheckedChange={() => togglePromoActive(promo)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem("promo_codes", promo.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {promoCodes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun code promo</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowBannerModal(true)}>
              <Plus className="h-4 w-4 mr-1" />Nouvelle bannière
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Clics</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map(banner => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell><Badge variant="secondary">{banner.position}</Badge></TableCell>
                    <TableCell><Eye className="h-3 w-3 inline mr-1" />{banner.view_count}</TableCell>
                    <TableCell><MousePointer className="h-3 w-3 inline mr-1" />{banner.click_count}</TableCell>
                    <TableCell><Switch checked={banner.is_active} onCheckedChange={() => toggleBanner(banner.id, banner.is_active)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem("marketing_banners", banner.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {banners.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune bannière</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Popups Tab */}
        <TabsContent value="popups" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowPopupModal(true)}>
              <Plus className="h-4 w-4 mr-1" />Nouveau popup
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Affichages</TableHead>
                  <TableHead>Clics</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map(popup => (
                  <TableRow key={popup.id}>
                    <TableCell className="font-medium">{popup.title}</TableCell>
                    <TableCell><Badge variant="outline">{popup.popup_type}</Badge></TableCell>
                    <TableCell>{popup.display_count}</TableCell>
                    <TableCell>{popup.click_count}</TableCell>
                    <TableCell><Switch checked={popup.is_active} onCheckedChange={() => togglePopup(popup.id, popup.is_active)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem("marketing_popups", popup.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {popups.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun popup</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Sponsored Tab */}
        <TabsContent value="sponsored" className="mt-4">
          <Card className="p-4 mb-4">
            <p className="text-sm text-muted-foreground">
              {restaurants.filter(r => r.is_sponsored).length} restaurant(s) sponsorisé(s)
            </p>
          </Card>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Sponsorisé</TableHead>
                  <TableHead>Jusqu'au</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map(rest => (
                  <TableRow key={rest.id}>
                    <TableCell className="font-medium">{rest.name}</TableCell>
                    <TableCell>
                      <Switch checked={rest.is_sponsored || false} onCheckedChange={() => toggleSponsored(rest.id, rest.is_sponsored || false)} />
                    </TableCell>
                    <TableCell>
                      {rest.sponsored_until ? format(new Date(rest.sponsored_until), "d MMM yyyy", { locale: fr }) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promo Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau code promo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Code</Label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="font-mono uppercase" /></div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({...formData, discount_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valeur</Label><Input type="number" value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: Number(e.target.value)})} /></div>
            </div>
            <div><Label>Expire le</Label><Input type="date" value={formData.valid_until} onChange={(e) => setFormData({...formData, valid_until: e.target.value})} /></div>
            <Button onClick={createPromoCode} className="w-full">Créer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Banner Modal */}
      <Dialog open={showBannerModal} onOpenChange={setShowBannerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle bannière</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titre</Label><Input value={bannerForm.title} onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})} /></div>
            <div><Label>Sous-titre</Label><Input value={bannerForm.subtitle} onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})} /></div>
            <div><Label>URL Image</Label><Input value={bannerForm.image_url} onChange={(e) => setBannerForm({...bannerForm, image_url: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Couleur</Label><Input type="color" value={bannerForm.background_color} onChange={(e) => setBannerForm({...bannerForm, background_color: e.target.value})} /></div>
              <div><Label>Position</Label>
                <Select value={bannerForm.position} onValueChange={(v) => setBannerForm({...bannerForm, position: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Haut</SelectItem>
                    <SelectItem value="middle">Milieu</SelectItem>
                    <SelectItem value="bottom">Bas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={createBanner} className="w-full">Créer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Popup Modal */}
      <Dialog open={showPopupModal} onOpenChange={setShowPopupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau popup</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titre</Label><Input value={popupForm.title} onChange={(e) => setPopupForm({...popupForm, title: e.target.value})} /></div>
            <div><Label>Contenu</Label><Textarea value={popupForm.content} onChange={(e) => setPopupForm({...popupForm, content: e.target.value})} /></div>
            <div><Label>Type</Label>
              <Select value={popupForm.popup_type} onValueChange={(v) => setPopupForm({...popupForm, popup_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="announcement">Annonce</SelectItem>
                  <SelectItem value="welcome">Bienvenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Texte bouton</Label><Input value={popupForm.button_text} onChange={(e) => setPopupForm({...popupForm, button_text: e.target.value})} /></div>
            <Button onClick={createPopup} className="w-full">Créer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}