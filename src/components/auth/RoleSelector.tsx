import { Store, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleSelectorProps {
  onSelectRole: (role: "customer" | "restaurant_owner") => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Rejoignez DeliverEat</h2>
        <p className="text-muted-foreground">Comment souhaitez-vous utiliser la plateforme ?</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card 
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectRole("customer")}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Client</CardTitle>
            <CardDescription>
              Commander des repas depuis vos restaurants préférés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Parcourir les restaurants</li>
              <li>• Commander en ligne</li>
              <li>• Suivre vos livraisons</li>
              <li>• Gérer vos adresses</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectRole("restaurant_owner")}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Restaurateur</CardTitle>
            <CardDescription>
              Gérer votre restaurant et recevoir des commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Créer votre restaurant</li>
              <li>• Gérer votre menu</li>
              <li>• Recevoir des commandes</li>
              <li>• Suivre vos performances</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
