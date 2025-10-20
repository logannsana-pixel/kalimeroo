import { Facebook, Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">DeliverEat</h3>
            <p className="text-muted-foreground">
              Manger comme au restaurant sans sortir de chez soi
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Pour vous</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Commander</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Créer un compte</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Aide</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Partenaires</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Devenir restaurant partenaire</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Devenir livreur</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 DeliverEat. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};
