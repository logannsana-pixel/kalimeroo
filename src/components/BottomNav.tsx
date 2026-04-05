import { Link, useLocation } from "react-router-dom";
import { Home, Search, ClipboardList, ShoppingCart, User, LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const isActive = (path: string) => {
    if (path === "/" || path === "/home") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Hide on admin dashboard
  if (userRole === "admin") return null;

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
        className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 transition-all duration-200 active:scale-95`}
      >
        <div className="relative">
          <Icon
            className={`h-5 w-5 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
            strokeWidth={active ? 2.5 : 1.8}
          />
          {badge != null && badge > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-bold px-1">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
        <span
          className={`text-[11px] font-medium font-body ${
            active ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        {active && (
          <div className="w-5 h-[3px] rounded-full bg-primary mt-0.5" />
        )}
      </Link>
    );
  };

  const NavContainer = ({ children }: { children: React.ReactNode }) => (
    <nav
      data-testid="bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-18 px-2">
        {children}
      </div>
    </nav>
  );

  // Delivery driver
  if (userRole === "delivery_driver") {
    return (
      <NavContainer>
        <NavItem to="/delivery-dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </NavContainer>
    );
  }

  // Restaurant owner
  if (userRole === "restaurant_owner") {
    return (
      <NavContainer>
        <NavItem to="/restaurant-dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </NavContainer>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <NavContainer>
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to="/restaurants" icon={Search} label="Explorer" />
        <NavItem to="/auth" icon={LogIn} label="Connexion" />
      </NavContainer>
    );
  }

  // Customer (default)
  return (
    <NavContainer>
      <NavItem to="/home" icon={Home} label="Accueil" />
      <NavItem to="/restaurants" icon={Search} label="Rechercher" />
      <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
      <NavItem to="/profile" icon={User} label="Profil" />
      <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
    </NavContainer>
  );
};
