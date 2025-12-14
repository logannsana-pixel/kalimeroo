import { Link, useLocation } from "react-router-dom";
import { Home, User, ClipboardList, ShoppingCart } from "lucide-react";
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
      <Link to={to} className="flex flex-col items-center justify-center flex-1 gap-1 relative">
        <div
          className={`relative flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 ${
            active ? "bg-primary text-primary-foreground shadow-glow scale-105" : "text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />

          {badge && badge > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>

        <span
          className={`text-[10px] transition-all ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}
        >
          {label}
        </span>
      </Link>
    );
  };

  const NavContainer = ({ children }: { children: React.ReactNode }) => (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 safe-area-bottom">
      <div
        className="flex items-center justify-between gap-2 px-4 h-16 min-w-[280px] max-w-[360px]
        rounded-full bg-card/95 backdrop-blur-xl border border-border/40
        shadow-float"
      >
        {children}
      </div>
    </nav>
  );

  // 👤 Non connecté
  if (!user) {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
        <NavItem to="/auth" icon={User} label="Connexion" />
      </NavContainer>
    );
  }

  // 🧑 Client
  if (userRole === "customer") {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
        <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </NavContainer>
    );
  }

  // 🏪 Resto / 🚴 Livreur / 👑 Admin
  return (
    <NavContainer>
      <NavItem to="/" icon={Home} label="Accueil" />
      <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
      <NavItem to="/profile" icon={User} label="Profil" />
    </NavContainer>
  );
};
