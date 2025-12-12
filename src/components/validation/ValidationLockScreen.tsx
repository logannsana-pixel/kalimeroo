import { useState } from "react";
import { Lock, Clock, XCircle, RefreshCw, LogOut, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface ValidationLockScreenProps {
  type: 'restaurant' | 'driver';
  isValidated: boolean;
  validationNotes?: string | null;
  onLogout: () => void;
  onRequestRevalidation: () => Promise<void>;
  entityName?: string;
}

export function ValidationLockScreen({
  type,
  isValidated,
  validationNotes,
  onLogout,
  onRequestRevalidation,
  entityName
}: ValidationLockScreenProps) {
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");

  const isRejected = validationNotes && !isValidated;
  const isPending = !isValidated && !validationNotes;

  const handleRequestRevalidation = async () => {
    setRequesting(true);
    try {
      await onRequestRevalidation();
      toast.success("Demande de vérification envoyée !");
      setMessage("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Lock Icon */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
            isRejected ? 'bg-destructive/10' : 'bg-warning/10'
          }`}>
            {isRejected ? (
              <XCircle className={`w-12 h-12 text-destructive`} />
            ) : (
              <Lock className={`w-12 h-12 text-warning`} />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {isRejected ? 'Compte non validé' : 'En attente de validation'}
          </h1>
          
          <Badge variant={isRejected ? "destructive" : "secondary"} className="mb-4">
            {isRejected ? 'Refusé' : 'En cours de vérification'}
          </Badge>

          {entityName && (
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {entityName}
            </p>
          )}
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {isPending ? (
                <>
                  <Clock className="w-5 h-5 text-warning" />
                  Vérification en cours
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Action requise
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              <p className="text-muted-foreground">
                Votre compte {type === 'restaurant' ? 'restaurant' : 'livreur'} est en attente de validation par notre équipe. 
                Ce processus peut prendre jusqu'à 24-48 heures.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Votre demande a été examinée mais n'a pas pu être validée. 
                Veuillez consulter les instructions ci-dessous.
              </p>
            )}

            {/* Rejection message */}
            {isRejected && validationNotes && (
              <Alert variant="destructive">
                <FileText className="h-4 w-4" />
                <AlertTitle>Message de l'administrateur</AlertTitle>
                <AlertDescription className="mt-2 whitespace-pre-wrap">
                  {validationNotes}
                </AlertDescription>
              </Alert>
            )}

            {/* Features locked message */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <p className="font-medium text-sm">Fonctionnalités bloquées :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {type === 'restaurant' ? (
                  <>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Gestion du menu
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Réception des commandes
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Codes promo
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Statistiques
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Voir les commandes disponibles
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Accepter des livraisons
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Gains et paiements
                    </li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Re-request validation */}
        {isRejected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Demander une nouvelle vérification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Message optionnel pour l'équipe de validation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <Button 
                className="w-full" 
                onClick={handleRequestRevalidation}
                disabled={requesting}
              >
                {requesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Redemander la vérification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending status info */}
        {isPending && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Patientez</p>
                  <p className="text-sm text-muted-foreground">
                    Notre équipe examine votre dossier
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>

        {/* Contact support */}
        <p className="text-center text-sm text-muted-foreground">
          Des questions ? Contactez notre support à{' '}
          <a href="mailto:support@delivereat.cg" className="text-primary hover:underline">
            support@delivereat.cg
          </a>
        </p>
      </div>
    </div>
  );
}
