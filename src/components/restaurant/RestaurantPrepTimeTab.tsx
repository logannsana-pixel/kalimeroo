import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Pause, Play, AlertTriangle, Loader2 } from "lucide-react";

export const RestaurantPrepTimeTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prepTime, setPrepTime] = useState(30);
  const [isOpen, setIsOpen] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(15);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('restaurants')
        .select('delivery_time, is_active')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (data) {
        // Parse delivery time like "30-45 min" to get base value
        const match = data.delivery_time?.match(/(\d+)/);
        if (match) {
          setPrepTime(parseInt(match[1]));
        }
        setIsOpen(data.is_active ?? true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deliveryTime = `${prepTime}-${prepTime + 15} min`;

      await supabase
        .from('restaurants')
        .update({ 
          delivery_time: deliveryTime,
          is_active: isOpen
        })
        .eq('owner_id', user.id);

      toast.success("Paramètres sauvegardés");
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handlePauseStore = async (minutes: number) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('restaurants')
        .update({ is_active: false })
        .eq('owner_id', user.id);

      setIsPaused(true);
      setIsOpen(false);
      toast.success(`Restaurant en pause pour ${minutes} minutes`);

      // Auto-reopen after pause duration
      setTimeout(async () => {
        await supabase
          .from('restaurants')
          .update({ is_active: true })
          .eq('owner_id', user.id);
        setIsPaused(false);
        setIsOpen(true);
        toast.success("Restaurant réouvert automatiquement");
      }, minutes * 60 * 1000);

    } catch (error) {
      console.error('Error pausing:', error);
      toast.error("Erreur lors de la pause");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Temps de préparation</h2>
        <Badge variant={isOpen ? "default" : "secondary"}>
          {isOpen ? "Ouvert" : "Fermé"}
        </Badge>
      </div>

      {/* Store Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOpen ? <Play className="h-5 w-5 text-green-500" /> : <Pause className="h-5 w-5 text-orange-500" />}
            Statut du restaurant
          </CardTitle>
          <CardDescription>
            Activez ou désactivez la réception de commandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="store-open" className="text-base">
              Accepter les commandes
            </Label>
            <Switch
              id="store-open"
              checked={isOpen}
              onCheckedChange={(checked) => {
                setIsOpen(checked);
                setIsPaused(false);
              }}
            />
          </div>

          {isPaused && (
            <div className="flex items-center gap-2 text-orange-500 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Restaurant en pause temporaire
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pause Store */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pause className="h-5 w-5" />
            Pause temporaire
          </CardTitle>
          <CardDescription>
            Mettez votre restaurant en pause pendant une durée définie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60].map((minutes) => (
              <Button
                key={minutes}
                variant="outline"
                onClick={() => handlePauseStore(minutes)}
                disabled={saving || isPaused}
              >
                {minutes} min
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prep Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temps de préparation moyen
          </CardTitle>
          <CardDescription>
            Définissez le temps moyen de préparation de vos commandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temps de préparation</span>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {prepTime}-{prepTime + 15} min
              </Badge>
            </div>
            <Slider
              value={[prepTime]}
              onValueChange={(value) => setPrepTime(value[0])}
              min={10}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 min</span>
              <span>45 min</span>
              <span>90 min</span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
