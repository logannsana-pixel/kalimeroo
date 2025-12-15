import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings, Wallet, Calendar, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentSettingsModalProps {
  entityId: string | null;
  entityType: "driver" | "restaurant";
  entityName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface PaymentSettings {
  id?: string;
  entity_id: string;
  entity_type: string;
  payment_method: string;
  payment_frequency: string;
  custom_frequency_days: number | null;
  min_payout_amount: number;
  is_auto_payout: boolean;
  mobile_money_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  next_payout_date: string | null;
}

export function PaymentSettingsModal({ 
  entityId, 
  entityType, 
  entityName, 
  isOpen, 
  onClose, 
  onUpdate 
}: PaymentSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    entity_id: entityId || "",
    entity_type: entityType,
    payment_method: "mobile_money",
    payment_frequency: "weekly",
    custom_frequency_days: null,
    min_payout_amount: 5000,
    is_auto_payout: false,
    mobile_money_number: null,
    bank_name: null,
    bank_account_number: null,
    next_payout_date: null
  });

  useEffect(() => {
    if (entityId && isOpen) {
      fetchSettings();
    }
  }, [entityId, isOpen]);

  const fetchSettings = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("entity_id", entityId)
        .eq("entity_type", entityType)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as PaymentSettings);
      } else {
        setSettings({
          entity_id: entityId,
          entity_type: entityType,
          payment_method: "mobile_money",
          payment_frequency: "weekly",
          custom_frequency_days: null,
          min_payout_amount: 5000,
          is_auto_payout: false,
          mobile_money_number: null,
          bank_name: null,
          bank_account_number: null,
          next_payout_date: null
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const calculateNextPayoutDate = (frequency: string, customDays?: number | null) => {
    const now = new Date();
    let nextDate = new Date(now);

    switch (frequency) {
      case 'weekly':
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'bi_weekly':
        nextDate.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case 'custom':
        if (customDays) {
          nextDate.setDate(now.getDate() + customDays);
        }
        break;
    }

    return nextDate.toISOString();
  };

  const handleSave = async () => {
    if (!entityId) return;
    setSaving(true);
    try {
      const nextPayoutDate = calculateNextPayoutDate(
        settings.payment_frequency, 
        settings.custom_frequency_days
      );

      const dataToSave = {
        entity_id: entityId,
        entity_type: entityType,
        payment_method: settings.payment_method,
        payment_frequency: settings.payment_frequency,
        custom_frequency_days: settings.payment_frequency === 'custom' ? settings.custom_frequency_days : null,
        min_payout_amount: settings.min_payout_amount,
        is_auto_payout: settings.is_auto_payout,
        mobile_money_number: settings.payment_method === 'mobile_money' ? settings.mobile_money_number : null,
        bank_name: settings.payment_method === 'bank' ? settings.bank_name : null,
        bank_account_number: settings.payment_method === 'bank' ? settings.bank_account_number : null,
        next_payout_date: nextPayoutDate,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        const { error } = await supabase
          .from("payment_settings")
          .update(dataToSave)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_settings")
          .insert(dataToSave);
        if (error) throw error;
      }

      toast.success("Paramètres enregistrés");
      onClose();
      onUpdate?.();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Paramètres de paiement
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{entityName}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Méthode de paiement
              </Label>
              <Select 
                value={settings.payment_method} 
                onValueChange={(v) => setSettings({ ...settings, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Money Number */}
            {settings.payment_method === 'mobile_money' && (
              <div className="space-y-2">
                <Label>Numéro Mobile Money</Label>
                <Input
                  value={settings.mobile_money_number || ""}
                  onChange={(e) => setSettings({ ...settings, mobile_money_number: e.target.value })}
                  placeholder="06 XXX XX XX"
                />
              </div>
            )}

            {/* Bank Details */}
            {settings.payment_method === 'bank' && (
              <>
                <div className="space-y-2">
                  <Label>Nom de la banque</Label>
                  <Input
                    value={settings.bank_name || ""}
                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numéro de compte</Label>
                  <Input
                    value={settings.bank_account_number || ""}
                    onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Payment Frequency */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fréquence de paiement
              </Label>
              <Select 
                value={settings.payment_frequency} 
                onValueChange={(v) => setSettings({ ...settings, payment_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="bi_weekly">Bi-mensuel</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Frequency Days */}
            {settings.payment_frequency === 'custom' && (
              <div className="space-y-2">
                <Label>Tous les X jours</Label>
                <Input
                  type="number"
                  value={settings.custom_frequency_days || ""}
                  onChange={(e) => setSettings({ ...settings, custom_frequency_days: Number(e.target.value) })}
                  placeholder="Ex: 10"
                />
              </div>
            )}

            {/* Min Payout Amount */}
            <div className="space-y-2">
              <Label>Montant minimum de paiement (FCFA)</Label>
              <Input
                type="number"
                value={settings.min_payout_amount}
                onChange={(e) => setSettings({ ...settings, min_payout_amount: Number(e.target.value) })}
              />
            </div>

            {/* Auto Payout */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Paiement automatique</p>
                  <p className="text-xs text-muted-foreground">Payer automatiquement à la date prévue</p>
                </div>
              </div>
              <Switch
                checked={settings.is_auto_payout}
                onCheckedChange={(v) => setSettings({ ...settings, is_auto_payout: v })}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}