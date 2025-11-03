import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
              isActive("/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Accueil</span>
          </Link>

          <Link
            to="/restaurants"
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
              isActive("/restaurants")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-medium">Explorer</span>
          </Link>

          <Link
            to="/auth"
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
              isActive("/auth")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Connexion</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
            isActive("/")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Accueil</span>
        </Link>

        {userRole === "customer" && (
          <>
            <Link
              to="/restaurants"
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive("/restaurants")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Explorer</span>
            </Link>

            <Link
              to="/cart"
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors relative ${
                isActive("/cart")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Panier</span>
            </Link>
          </>
        )}

        {(userRole === "restaurant_owner" || userRole === "delivery_driver" || userRole === "admin") && (
          <Link
            to={getDashboardLink()}
            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
              location.pathname.includes("dashboard")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
        )}

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
            isActive("/profile")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profil</span>
        </Link>
      </div>
    </nav>
  );
};
