import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultCheckoutSettings, type CheckoutSettings } from "@/lib/checkout-payments";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export function RestaurantCheckoutSettings() {
  const [restaurantId, setRestaurantId] = useState<string>();
  const [settings, setSettings] = useState<CheckoutSettings>(defaultCheckoutSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: restaurants, error } = await supabase.from("restaurants").select("id").eq("owner_id", user.id);
        if (error) throw error;
        if (restaurants?.length !== 1) throw new Error("Sélection du restaurant indisponible");
        const id = restaurants[0].id;
        setRestaurantId(id);
        const { data, error: settingsError } = await supabase.from("restaurant_checkout_settings").select("*").eq("restaurant_id", id).maybeSingle();
        if (settingsError) throw settingsError;
        if (data) setSettings({ ...data, deposit_type: data.deposit_type as CheckoutSettings["deposit_type"] });
      } catch (error) { toast.error(error instanceof Error ? error.message : "Chargement impossible"); }
      finally { setLoading(false); }
    })();
  }, []);
  const save = async () => {
    if (!restaurantId) return;
    if (!settings.allow_cod && !settings.allow_mobile_money) { toast.error("Activez au moins un moyen de paiement"); return; }
    if (settings.deposit_type !== "none" && (!Number.isFinite(settings.deposit_value) || settings.deposit_value <= 0 || (settings.deposit_type === "percentage" && settings.deposit_value >= 100))) { toast.error("Saisissez un acompte valide, inférieur à 100 %"); return; }
    setSaving(true);
    const { error } = await supabase.from("restaurant_checkout_settings").upsert({ restaurant_id: restaurantId, ...settings, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Moyens de paiement enregistrés");
  };
  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return <section className="space-y-4 border-b border-border pb-6" aria-label="Paiements des clients">
    <h3 className="text-lg font-semibold">Paiements des clients</h3>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="allow-cod">Paiement à la livraison</Label><Switch id="allow-cod" checked={settings.allow_cod} onCheckedChange={allow_cod => setSettings({ ...settings, allow_cod })} /></div>
    <div className="flex items-center justify-between gap-3"><Label htmlFor="allow-momo">Mobile Money · Nyole</Label><Switch id="allow-momo" checked={settings.allow_mobile_money} onCheckedChange={allow_mobile_money => setSettings({ ...settings, allow_mobile_money, ...(allow_mobile_money ? {} : { deposit_type: "none", deposit_value: 0 }) })} /></div>
    {settings.allow_mobile_money && <div className="space-y-3">
      <Label htmlFor="deposit-type">Acompte facultatif</Label>
      <Select value={settings.deposit_type} onValueChange={(value: CheckoutSettings["deposit_type"]) => setSettings({ ...settings, deposit_type: value, deposit_value: value === "none" ? 0 : value === "percentage" ? 30 : 1000 })}>
        <SelectTrigger id="deposit-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sans acompte</SelectItem><SelectItem value="percentage">Pourcentage</SelectItem><SelectItem value="fixed">Montant fixe</SelectItem></SelectContent>
      </Select>
      {settings.deposit_type !== "none" && <>
        {settings.deposit_type === "percentage" && <div className="flex gap-2">{[30, 50].map(value => <Button key={value} variant={settings.deposit_value === value ? "default" : "outline"} onClick={() => setSettings({ ...settings, deposit_value: value })}>{value} %</Button>)}</div>}
        <Label htmlFor="deposit-value">{settings.deposit_type === "percentage" ? "Pourcentage personnalisé" : "Montant de l’acompte (FCFA)"}</Label>
        <Input id="deposit-value" type="number" min="1" max={settings.deposit_type === "percentage" ? 99 : undefined} value={settings.deposit_value} onChange={e => setSettings({ ...settings, deposit_value: Number(e.target.value) })} />
      </>}
    </div>}
    <Button onClick={save} disabled={saving || !restaurantId}><Save className="h-4 w-4 mr-2" />{saving ? "Enregistrement…" : "Enregistrer les moyens de paiement"}</Button>
  </section>;
}