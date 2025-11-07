import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  valid_until: string;
  is_active: boolean;
}

export function PromoCodesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_amount: 0,
    max_uses: null as number | null,
    valid_until: "",
  });

  useEffect(() => {
    if (user) {
      fetchRestaurantAndPromoCodes();
    }
  }, [user]);

  const fetchRestaurantAndPromoCodes = async () => {
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (restaurant) {
      setRestaurantId(restaurant.id);
      fetchPromoCodes(restaurant.id);
    }
  };

  const fetchPromoCodes = async (restId: string) => {
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("restaurant_id", restId)
      .order("created_at", { ascending: false });

    if (data) setPromoCodes(data);
  };

  const addPromoCode = async () => {
    if (!restaurantId || !newPromo.code || !newPromo.valid_until) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("promo_codes").insert({
      ...newPromo,
      code: newPromo.code.toUpperCase(),
      restaurant_id: restaurantId,
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le code promo",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Code promo créé",
      description: "Le code promo a été créé avec succès",
    });

    setIsAdding(false);
    setNewPromo({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      min_order_amount: 0,
      max_uses: null,
      valid_until: "",
    });
    fetchPromoCodes(restaurantId);
  };

  const deletePromoCode = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le code promo",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Code promo supprimé",
      description: "Le code promo a été supprimé avec succès",
    });

    fetchPromoCodes(restaurantId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Codes Promo</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau code
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input
                value={newPromo.code}
                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                placeholder="PROMO10"
              />
            </div>
            <div>
              <Label>Type de réduction</Label>
              <Select
                value={newPromo.discount_type}
                onValueChange={(value) => setNewPromo({ ...newPromo, discount_type: value })}
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
            <div>
              <Label>Valeur de réduction</Label>
              <Input
                type="number"
                value={newPromo.discount_value}
                onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Commande minimum</Label>
              <Input
                type="number"
                value={newPromo.min_order_amount}
                onChange={(e) => setNewPromo({ ...newPromo, min_order_amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Utilisations max (optionnel)</Label>
              <Input
                type="number"
                value={newPromo.max_uses || ""}
                onChange={(e) => setNewPromo({ ...newPromo, max_uses: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div>
              <Label>Valide jusqu'au</Label>
              <Input
                type="date"
                value={newPromo.valid_until}
                onChange={(e) => setNewPromo({ ...newPromo, valid_until: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                value={newPromo.description}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                placeholder="10% de réduction sur votre commande"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addPromoCode}>Créer</Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {promoCodes.map((promo) => (
          <Card key={promo.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">{promo.code}</h3>
                  {!promo.is_active && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">Inactif</span>
                  )}
                </div>
                <p className="text-muted-foreground">{promo.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>
                    Réduction: {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `${promo.discount_value}€`}
                  </span>
                  <span>Min: {promo.min_order_amount}€</span>
                  {promo.max_uses && (
                    <span>Utilisé: {promo.uses_count}/{promo.max_uses}</span>
                  )}
                  <span>Valide jusqu'au: {new Date(promo.valid_until).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deletePromoCode(promo.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
