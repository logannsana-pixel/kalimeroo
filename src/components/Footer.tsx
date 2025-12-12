import { Facebook, Instagram, Twitter, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={cn("bg-card border-t border-border/50 py-12 mt-8", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-bold text-xl">K</span>
              </div>
              <div>
                <span className="font-bold text-xl">
                  <span className="text-gradient-primary">KALI</span>
                  <span className="text-foreground">MERO</span>
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm">
              Mangez comme au restaurant, sans sortir de chez vous 🍕
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* For Customers */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Pour vous
            </h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li><Link to="/restaurants" className="hover:text-primary transition-colors">Commander</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Créer un compte</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Aide & Contact</a></li>
            </ul>
          </div>
          
          {/* For Partners */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Partenaires
            </h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li><Link to="/auth" className="hover:text-primary transition-colors">Devenir restaurant partenaire</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Devenir livreur</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conditions</a></li>
            </ul>
          </div>
          
          {/* Info */}
          <div>
            <h4 className="font-semibold mb-4">Informations</h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">CGU</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-sm">
          <p className="flex items-center gap-1">
            &copy; 2025 KALIMERO. Fait avec <Heart className="w-4 h-4 text-primary fill-primary" /> au Congo
          </p>
          <p className="text-xs">
            🇨🇬 Brazzaville • Pointe-Noire
          </p>
        </div>
      </div>
    </footer>
  );
};
