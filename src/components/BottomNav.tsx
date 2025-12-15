import { Link, useLocation } from "react-router-dom";
import { Home, User, ClipboardList, ShoppingCart, Search, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavItem = ({
    to,
    icon: Icon,
    label,
    badge,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
  }) => {
    const active = isActive(to);

    return (
      <Link 
        to={to} 
        className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 transition-all duration-200 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <div className="relative">
          <Icon 
            className={`h-5 w-5 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`} 
            strokeWidth={active ? 2.5 : 2} 
          />
          {badge && badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
          {label}
        </span>
      </Link>
    );
  };

  const NavContainer = ({ children }: { children: React.ReactNode }) => (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-card/90 backdrop-blur-xl border border-border/20 rounded-2xl shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {children}
      </div>
    </nav>
  );

  // Non connecté
  if (!user) {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/restaurants" icon={UtensilsCrossed} label="Restos" />
        <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
        <NavItem to="/auth" icon={User} label="Connexion" />
      </NavContainer>
    );
  }

  // Client connecté
  if (userRole === "customer") {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/restaurants" icon={UtensilsCrossed} label="Restos" />
        <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
        <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </NavContainer>
    );
  }

  // Autres rôles
  return (
    <NavContainer>
      <NavItem to="/" icon={Home} label="Accueil" />
      <NavItem to="/restaurants" icon={UtensilsCrossed} label="Restos" />
      <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
      <NavItem to="/profile" icon={User} label="Profil" />
    </NavContainer>
  );
};