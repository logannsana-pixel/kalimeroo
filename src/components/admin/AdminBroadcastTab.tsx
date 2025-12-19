import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Users, Bell, History, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  sent_at: string;
  sent_by: string;
  recipients_count: number;
}

type AppRole = "admin" | "customer" | "delivery_driver" | "restaurant_owner";

export function AdminBroadcastTab() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRoles, setTargetRoles] = useState<AppRole[]>([]);
  const [recipientsCount, setRecipientsCount] = useState(0);

  const roles: { id: AppRole; label: string }[] = [
    { id: "customer", label: "Clients" },
    { id: "restaurant_owner", label: "Restaurateurs" },
    { id: "delivery_driver", label: "Livreurs" },
    { id: "admin", label: "Admins" },
  ];

  useEffect(() => {
    fetchRecipientsCount();
  }, [targetRoles]);

  const fetchRecipientsCount = async () => {
    if (targetRoles.length === 0) {
      setRecipientsCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .in("role", targetRoles);

      if (!error) {
        setRecipientsCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  const toggleRole = (roleId: AppRole) => {
    setTargetRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Veuillez remplir le titre et le message");
      return;
    }
    if (targetRoles.length === 0) {
      toast.error("Veuillez sélectionner au moins un groupe cible");
      return;
    }

    setSending(true);
    try {
      // Get all user IDs for selected roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", targetRoles);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        toast.error("Aucun destinataire trouvé");
        return;
      }

      // Create notifications for each user
      const notifications = userRoles.map(ur => ({
        user_id: ur.user_id,
        title: title,
        message: message,
        type: "broadcast",
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) throw insertError;

      toast.success(`Message envoyé à ${userRoles.length} destinataire(s)`);
      setTitle("");
      setMessage("");
      setTargetRoles([]);
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messagerie Broadcast</h2>
        <p className="text-muted-foreground">Envoyez des notifications à tous les utilisateurs ou à des groupes spécifiques</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Nouveau message
            </CardTitle>
            <CardDescription>
              Composez votre message et sélectionnez les destinataires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titre du message</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouvelle fonctionnalité disponible"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu du message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Destinataires</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={targetRoles.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <label htmlFor={role.id} className="text-sm cursor-pointer">
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {recipientsCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{recipientsCount}</strong> destinataire(s) sélectionné(s)
                </span>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleSend}
              disabled={sending || !title || !message || targetRoles.length === 0}
            >
              {sending ? "Envoi en cours..." : "Envoyer le message"}
              <Bell className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Modèles rapides
            </CardTitle>
            <CardDescription>
              Utilisez des modèles pré-définis pour gagner du temps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setTitle("Maintenance prévue");
                setMessage("Une maintenance est prévue ce soir de 23h à 1h. L'application sera temporairement indisponible.");
                setTargetRoles(["customer", "restaurant_owner", "delivery_driver"]);
              }}
            >
              <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
              <div>
                <p className="font-medium">Maintenance</p>
                <p className="text-xs text-muted-foreground">Notification de maintenance</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setTitle("🎉 Nouvelle fonctionnalité !");
                setMessage("Découvrez notre nouvelle fonctionnalité dans l'application. Essayez-la dès maintenant !");
                setTargetRoles(["customer"]);
              }}
            >
              <Bell className="w-4 h-4 mr-2 text-primary" />
              <div>
                <p className="font-medium">Nouvelle fonctionnalité</p>
                <p className="text-xs text-muted-foreground">Pour les clients</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                setTitle("📊 Rapport mensuel disponible");
                setMessage("Votre rapport de performance du mois est maintenant disponible dans votre tableau de bord.");
                setTargetRoles(["restaurant_owner", "delivery_driver"]);
              }}
            >
              <Users className="w-4 h-4 mr-2 text-green-500" />
              <div>
                <p className="font-medium">Rapport partenaires</p>
                <p className="text-xs text-muted-foreground">Restaurants & Livreurs</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
