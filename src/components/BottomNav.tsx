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

  // Non-authenticated user nav
  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Accueil</span>
          </Link>

          <Link
            to="/restaurants"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/restaurants") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Restaurants</span>
          </Link>

          <Link
            to="/auth"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/auth") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Connexion</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Customer nav
  if (userRole === "customer") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/") && location.pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Accueil</span>
          </Link>

          <Link
            to="/restaurants"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/restaurants") || isActive("/restaurant/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Restaurants</span>
          </Link>

          <Link
            to="/orders"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/orders") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-[10px] font-medium">Commandes</span>
          </Link>

          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              isActive("/cart") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Panier</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Restaurant owner / Delivery / Admin nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            location.pathname === "/" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>

        <Link
          to={getDashboardLink()}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            location.pathname.includes("dashboard") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
            isActive("/profile") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </div>
    </nav>
  );
};
