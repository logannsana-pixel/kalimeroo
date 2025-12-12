import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Megaphone, Plus, Edit, Trash2, Tag, Percent, Calendar, Store
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

export function AdminMarketingTab() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_uses: null as number | null,
    valid_until: "",
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get restaurant names
      const codesWithRestaurants = await Promise.all((data || []).map(async (code) => {
        if (code.restaurant_id) {
          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("name")
            .eq("id", code.restaurant_id)
            .single();
          return { ...code, restaurant_name: restaurant?.name };
        }
        return code;
      }));

      setPromoCodes(codesWithRestaurants);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Erreur lors du chargement des codes promo");
    } finally {
      setLoading(false);
    }
  };

  const togglePromoActive = async (promo: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !promo.is_active })
        .eq("id", promo.id);

      if (error) throw error;
      toast.success(promo.is_active ? "Code désactivé" : "Code activé");
      fetchPromoCodes();
    } catch (error) {
      console.error("Error toggling promo:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const createPromoCode = async () => {
    if (!formData.code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    try {
      const { error } = await supabase
        .from("promo_codes")
        .insert({
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

      if (error) throw error;
      toast.success("Code promo créé");
      setShowCreateModal(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      console.error("Error creating promo:", error);
      if (error.code === '23505') {
        toast.error("Ce code existe déjà");
      } else {
        toast.error("Erreur lors de la création");
      }
    }
  };

  const deletePromoCode = async (id: string) => {
    if (!confirm("Supprimer ce code promo ?")) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Code promo supprimé");
      fetchPromoCodes();
    } catch (error) {
      console.error("Error deleting promo:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      max_uses: null,
      valid_until: "",
    });
  };

  const activePromos = promoCodes.filter(p => p.is_active && new Date(p.valid_until) > new Date());
  const expiredPromos = promoCodes.filter(p => new Date(p.valid_until) <= new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing</h2>
          <p className="text-muted-foreground">Gérez vos codes promo et promotions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau code promo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{promoCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-success">{activePromos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Utilisations</p>
                <p className="text-2xl font-bold">
                  {promoCodes.reduce((sum, p) => sum + (p.uses_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Expirés</p>
                <p className="text-2xl font-bold">{expiredPromos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Codes promo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun code promo</p>
              </div>
            ) : (
              promoCodes.map((promo) => {
                const isExpired = new Date(promo.valid_until) <= new Date();
                return (
                  <div 
                    key={promo.id}
                    className={`p-4 rounded-xl border ${isExpired ? 'bg-muted/50 opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-lg">{promo.code}</span>
                          {promo.is_active && !isExpired ? (
                            <Badge className="bg-success/10 text-success border-success/30">Actif</Badge>
                          ) : isExpired ? (
                            <Badge variant="secondary">Expiré</Badge>
                          ) : (
                            <Badge variant="outline">Inactif</Badge>
                          )}
                          {promo.restaurant_name && (
                            <Badge variant="outline" className="text-xs">
                              <Store className="w-3 h-3 mr-1" />
                              {promo.restaurant_name}
                            </Badge>
                          )}
                        </div>
                        {promo.description && (
                          <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {promo.discount_type === 'percentage' 
                              ? `${promo.discount_value}%` 
                              : `${promo.discount_value.toLocaleString()} F`}
                          </span>
                          {promo.min_order_amount && promo.min_order_amount > 0 && (
                            <span>Min: {promo.min_order_amount.toLocaleString()} F</span>
                          )}
                          <span>
                            {promo.uses_count || 0}{promo.max_uses ? `/${promo.max_uses}` : ''} utilisations
                          </span>
                          <span>
                            Expire: {format(new Date(promo.valid_until), "d MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => togglePromoActive(promo)}
                          disabled={isExpired}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deletePromoCode(promo.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Promo Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau code promo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PROMO20"
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="20% de réduction sur votre commande"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de réduction</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  />
                  <span className="text-muted-foreground">
                    {formData.discount_type === 'percentage' ? '%' : 'F'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commande minimum</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                  <span className="text-muted-foreground">F</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Utilisations max</Label>
                <Input
                  type="number"
                  value={formData.max_uses || ""}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Illimité"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date d'expiration</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={createPromoCode}>
              Créer le code promo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}