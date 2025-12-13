import { Link, useLocation } from "react-router-dom";
import { Home, Search, User, LayoutDashboard, ClipboardList, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const BottomNav = () => {
  const location = useLocation();
  const { user, userRole } = useAuth();

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

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = to === "/" ? location.pathname === "/" : isActive(to);
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 relative ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${active ? "bg-primary/10" : ""}`}>
          <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
      </Link>
    );
  };

  // Non-authenticated user nav
  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/30 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <NavItem to="/" icon={Home} label="Accueil" />
          <NavItem to="/restaurants" icon={UtensilsCrossed} label="Menu" />
          <NavItem to="/auth" icon={User} label="Connexion" />
        </div>
      </nav>
    );
  }

  // Customer nav
  if (userRole === "customer") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/30 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <NavItem to="/" icon={Home} label="Accueil" />
          <NavItem to="/restaurants" icon={UtensilsCrossed} label="Menu" />
          <NavItem to="/orders" icon={ClipboardList} label="Commandes" />
          <NavItem to="/profile" icon={User} label="Profil" />
        </div>
      </nav>
    );
  }

  // Restaurant owner / Delivery / Admin nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/30 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        <NavItem to="/" icon={Home} label="Accueil" />
        <NavItem to={getDashboardLink()} icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/profile" icon={User} label="Profil" />
      </div>
    </nav>
  );
};
