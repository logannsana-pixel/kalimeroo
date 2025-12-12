import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, Save, DollarSign, Truck, Megaphone, 
  AlertTriangle, RefreshCw, Percent
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlatformSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
}

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("category");

      if (error) throw error;
      setSettings(data || []);
      
      // Create local state from settings
      const settingsMap: Record<string, any> = {};
      data?.forEach(s => {
        try {
          settingsMap[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        } catch {
          settingsMap[s.key] = s.value;
        }
      });
      setLocalSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(localSettings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: update.value, updated_at: update.updated_at })
          .eq("key", update.key);
        
        if (error) throw error;
      }

      toast.success("Paramètres enregistrés");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paramètres de la plateforme</h2>
          <p className="text-muted-foreground">Configurez les paramètres globaux de KALIMERO</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="finance" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="finance">
            <DollarSign className="w-4 h-4 mr-2" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="delivery">
            <Truck className="w-4 h-4 mr-2" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="marketing">
            <Megaphone className="w-4 h-4 mr-2" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Finance Settings */}
        <TabsContent value="finance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Commission plateforme
                </CardTitle>
                <CardDescription>
                  Pourcentage prélevé sur chaque commande
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.commission_rate || 15}
                    onChange={(e) => updateSetting('commission_rate', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frais de livraison de base</CardTitle>
                <CardDescription>
                  Frais minimum pour une livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.delivery_fee_base || 1000}
                    onChange={(e) => updateSetting('delivery_fee_base', Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">FCFA</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frais par kilomètre</CardTitle>
                <CardDescription>
                  Supplément par km de distance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.delivery_fee_per_km || 100}
                    onChange={(e) => updateSetting('delivery_fee_per_km', Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">FCFA/km</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part livreur</CardTitle>
                <CardDescription>
                  Pourcentage des frais de livraison pour le livreur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.driver_payout_percentage || 80}
                    onChange={(e) => updateSetting('driver_payout_percentage', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Commande minimum</CardTitle>
                <CardDescription>
                  Montant minimum requis pour passer commande
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.min_order_amount || 2000}
                    onChange={(e) => updateSetting('min_order_amount', Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">FCFA</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rayon de livraison maximum</CardTitle>
                <CardDescription>
                  Distance maximale pour les livraisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={localSettings.max_delivery_radius || 15}
                    onChange={(e) => updateSetting('max_delivery_radius', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">km</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Settings */}
        <TabsContent value="marketing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bannière promotionnelle</CardTitle>
                <CardDescription>
                  Afficher une bannière sur la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="promo-enabled">Activer la bannière</Label>
                  <Switch
                    id="promo-enabled"
                    checked={localSettings.promo_banner_enabled === true || localSettings.promo_banner_enabled === 'true'}
                    onCheckedChange={(checked) => updateSetting('promo_banner_enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texte de la bannière</Label>
                  <Textarea
                    value={localSettings.promo_banner_text || ''}
                    onChange={(e) => updateSetting('promo_banner_text', e.target.value)}
                    placeholder="Votre message promotionnel..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Mode maintenance
                </CardTitle>
                <CardDescription>
                  Désactiver temporairement l'accès à l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer le mode maintenance</p>
                    <p className="text-sm text-muted-foreground">
                      Les utilisateurs verront un message de maintenance
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.maintenance_mode === true || localSettings.maintenance_mode === 'true'}
                    onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Version de l'application</CardTitle>
                <CardDescription>
                  Version actuelle affichée aux utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={localSettings.app_version || '1.0.0'}
                  onChange={(e) => updateSetting('app_version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-32"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}