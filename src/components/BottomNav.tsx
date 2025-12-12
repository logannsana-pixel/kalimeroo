import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, LayoutDashboard, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const getDashboardLink = () => {
    switch (userRole) {
      case "restaurant_owner":
        return "/restaurant-dashboard";
      case "delivery_driver":
        return "/delivery-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "customer":
        return "/customer-dashboard";
      default:
        return "/";
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) => {
    const active = to === "/" ? location.pathname === "/" : isActive(to);
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <div className={`relative p-2 rounded-2xl transition-all duration-300 ${active ? "bg-primary/10 scale-110" : ""}`}>
          <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
          {badge && badge > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-glow animate-scale-in">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium transition-all ${active ? "font-semibold" : ""}`}>{label}</span>
        {active && (
          <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  // Non-authenticated user nav
  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 z-50 safe-area-bottom rounded-t-3xl shadow-float">
        <div className="flex items-center justify-around h-18 py-2">
          <NavItem to="/" icon={Home} label="Accueil" />
          <NavItem to="/restaurants" icon={Search} label="Restaurants" />
          <NavItem to="/auth" icon={User} label="Connexion" />
        </div>
      </nav>
    );
  }

  // Customer nav
  if (userRole === "customer") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 z-50 safe-area-bottom rounded-t-3xl shadow-float">
        <div className="flex items-center justify-around h-18 py-2">
          <NavItem to="/" icon={Home} label="Accueil" />
          <NavItem to="/restaurants" icon={Search} label="Explorer" />
          <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
          <NavItem to="/cart" icon={ShoppingCart} label="Panier" badge={cartCount} />
          <NavItem to="/profile" icon={User} label="Profil" />
        </div>
      </nav>
    );
  }

  // Restaurant owner / Delivery / Admin nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 z-50 safe-area-bottom rounded-t-3xl shadow-float">
      <div className="flex items-center justify-around h-18 py-2">
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to={getDashboardLink()} icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </div>
    </nav>
  );
};
