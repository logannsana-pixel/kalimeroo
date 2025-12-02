import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, Save, Copy } from "lucide-react";

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const DEFAULT_HOURS: DayHours = { open: "09:00", close: "22:00", isOpen: true };

export const BusinessHoursTab = () => {
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [hours, setHours] = useState<BusinessHours>({
    monday: { ...DEFAULT_HOURS },
    tuesday: { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday: { ...DEFAULT_HOURS },
    friday: { ...DEFAULT_HOURS },
    saturday: { ...DEFAULT_HOURS },
    sunday: { ...DEFAULT_HOURS },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurants')
        .select('id, business_hours')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setRestaurantId(data.id);
        if (data.business_hours) {
          const dbHours = data.business_hours as Record<string, { open: string; close: string }>;
          const formattedHours: BusinessHours = {} as BusinessHours;
          
          Object.keys(DAY_LABELS).forEach((day) => {
            const dayData = dbHours[day];
            formattedHours[day as keyof BusinessHours] = {
              open: dayData?.open || "09:00",
              close: dayData?.close || "22:00",
              isOpen: dayData?.open !== "closed",
            };
          });
          
          setHours(formattedHours);
        }
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
      toast.error("Erreur lors du chargement des horaires");
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const copyToAllDays = (sourceDay: keyof BusinessHours) => {
    const sourceHours = hours[sourceDay];
    const newHours: BusinessHours = {} as BusinessHours;
    
    Object.keys(DAY_LABELS).forEach((day) => {
      newHours[day as keyof BusinessHours] = { ...sourceHours };
    });
    
    setHours(newHours);
    toast.success(`Horaires de ${DAY_LABELS[sourceDay]} copiés sur tous les jours`);
  };

  const copyToWeekdays = (sourceDay: keyof BusinessHours) => {
    const sourceHours = hours[sourceDay];
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    setHours(prev => {
      const newHours = { ...prev };
      weekdays.forEach((day) => {
        newHours[day as keyof BusinessHours] = { ...sourceHours };
      });
      return newHours;
    });
    
    toast.success("Horaires copiés sur tous les jours de semaine");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dbHours: Record<string, { open: string; close: string }> = {};
      
      Object.entries(hours).forEach(([day, dayHours]) => {
        dbHours[day] = {
          open: dayHours.isOpen ? dayHours.open : "closed",
          close: dayHours.isOpen ? dayHours.close : "closed",
        };
      });

      const { error } = await supabase
        .from('restaurants')
        .update({ business_hours: dbHours })
        .eq('id', restaurantId);

      if (error) throw error;
      toast.success("Horaires enregistrés avec succès");
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Horaires d'ouverture
          </h2>
          <p className="text-muted-foreground mt-1">
            Définissez vos heures d'ouverture pour chaque jour
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Planning hebdomadaire</CardTitle>
          <CardDescription>
            Cliquez sur le bouton copier pour appliquer les mêmes horaires à plusieurs jours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(hours) as [keyof BusinessHours, DayHours][]).map(([day, dayHours]) => (
            <div 
              key={day} 
              className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg transition-colors ${
                dayHours.isOpen ? 'bg-muted/50' : 'bg-destructive/5'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[140px]">
                <Switch
                  checked={dayHours.isOpen}
                  onCheckedChange={(checked) => handleDayChange(day, 'isOpen', checked)}
                />
                <Label className={`font-semibold ${!dayHours.isOpen ? 'text-muted-foreground' : ''}`}>
                  {DAY_LABELS[day]}
                </Label>
              </div>

              {dayHours.isOpen ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Ouverture</Label>
                      <Input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <span className="text-muted-foreground mt-6">à</span>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Fermeture</Label>
                      <Input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToWeekdays(day)}
                      className="text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Semaine
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAllDays(day)}
                      className="text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Tous
                    </Button>
                  </div>
                </>
              ) : (
                <span className="text-destructive font-medium">Fermé</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-lg">Conseils</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Les clients verront ces horaires sur la page de votre restaurant</p>
          <p>• Les commandes ne seront pas bloquées en dehors des heures d'ouverture</p>
          <p>• Pensez à mettre à jour vos horaires lors des jours fériés</p>
        </CardContent>
      </Card>
    </div>
  );
};
