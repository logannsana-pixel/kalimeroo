import { Link, useLocation } from "react-router-dom";
import { Home, User, ClipboardList, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

/* ===============================
   🔧 SIZE CONFIG (future-proof)
   → change tout le sizing ici
================================ */
const NAV_SIZE = {
  bar: "h-15 px-3",

  iconWrap: "h-9 w-9",
  icon: "h-4.5 w-4.5",

  gap: "gap-1",
  label: "text-[9px]",
};

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
      <Link to={to} className={`flex items-center justify-center gap-2 px-4 py-2 relative transition-all duration-300 ${
        active ? "bg-primary rounded-full" : ""
      }`}>
        <div className="relative flex items-center justify-center">
          <Icon 
            className={`h-5 w-5 transition-colors duration-200 ${
              active ? "text-primary-foreground" : "text-muted-foreground"
            }`} 
            strokeWidth={active ? 2.5 : 2} 
          />

          {badge && badge > 0 && !active && (
            <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>

        {active && (
          <span className="text-xs font-semibold text-primary-foreground">
            {label}
          </span>
        )}
      </Link>
    );
  };

  const NavContainer = ({ children }: { children: React.ReactNode }) => (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 safe-area-bottom">
      <div
        className={`flex items-center justify-between gap-1
          ${NAV_SIZE.bar}
          min-w-[280px] max-w-[360px]
          rounded-full
          bg-secondary/95 backdrop-blur-xl
          border border-border/30
          shadow-float
        `}
      >
        {children}
      </div>
    </nav>
  );

  /* ===============================
     👤 Non connecté
  ================================ */
  if (!user) {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
        <NavItem to="/auth" icon={User} label="Connexion" />
      </NavContainer>
    );
  }

  /* ===============================
     🧑 Client
  ================================ */
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

  /* ===============================
     🏪 Resto / 🚴 Livreur / 👑 Admin
  ================================ */
  return (
    <NavContainer>
      <NavItem to="/" icon={Home} label="Accueil" />
      <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
      <NavItem to="/profile" icon={User} label="Profil" />
    </NavContainer>
  );
};
