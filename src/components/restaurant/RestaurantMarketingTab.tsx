import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Megaphone, 
  Tag, 
  TrendingUp, 
  Users, 
  Eye,
  Plus,
  Loader2,
  Percent
} from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
  valid_until: string;
}

export const RestaurantMarketingTab = () => {
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: '',
    valid_until: ''
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (data) {
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPromoCode = async () => {
    if (!newPromo.code || !newPromo.valid_until) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          restaurant_id: restaurant.id,
          code: newPromo.code.toUpperCase(),
          discount_type: newPromo.discount_type,
          discount_value: newPromo.discount_value,
          max_uses: newPromo.max_uses ? parseInt(newPromo.max_uses) : null,
          valid_until: newPromo.valid_until,
          is_active: true
        });

      if (error) throw error;

      toast.success("Code promo créé avec succès");
      setShowCreateForm(false);
      setNewPromo({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: '',
        valid_until: ''
      });
      fetchPromoCodes();
    } catch (error) {
      console.error('Error creating promo:', error);
      toast.error("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const togglePromoStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      setPromoCodes(prev => 
        prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p)
      );
      toast.success(currentStatus ? "Code désactivé" : "Code activé");
    } catch (error) {
      console.error('Error toggling promo:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Marketing</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau code promo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Codes actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {promoCodes.filter(p => p.is_active).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisations totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {promoCodes.reduce((sum, p) => sum + (p.uses_count || 0), 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meilleur code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {promoCodes.sort((a, b) => (b.uses_count || 0) - (a.uses_count || 0))[0]?.code || '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un code promo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="PROMO10"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="discount">Réduction (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={newPromo.discount_value}
                  onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_uses">Nombre max d'utilisations</Label>
                <Input
                  id="max_uses"
                  type="number"
                  placeholder="Illimité"
                  value={newPromo.max_uses}
                  onChange={(e) => setNewPromo({ ...newPromo, max_uses: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Date d'expiration *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={newPromo.valid_until}
                  onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createPromoCode} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Créer
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Mes codes promo
          </CardTitle>
          <CardDescription>
            Gérez vos promotions et réductions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun code promo</p>
              <p className="text-sm">Créez votre premier code promo pour attirer des clients</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promoCodes.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Percent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{promo.code}</span>
                        <Badge variant={promo.is_active ? "default" : "secondary"}>
                          {promo.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        -{promo.discount_value}% • {promo.uses_count || 0} utilisations
                        {promo.max_uses && ` / ${promo.max_uses} max`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expire le {new Date(promo.valid_until).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={promo.is_active}
                    onCheckedChange={() => togglePromoStatus(promo.id, promo.is_active)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
