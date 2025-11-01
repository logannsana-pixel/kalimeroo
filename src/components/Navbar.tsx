import { Link } from "react-router-dom";
import { ShoppingCart, User, Utensils, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg">
            <span className="text-white font-bold text-base md:text-lg">D</span>
          </div>
          <span className="font-bold text-base md:text-lg">DeliverEat</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4">
            {userRole === "customer" && (
              <>
                <Link to="/restaurants" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Restaurants
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </>
            )}
            {(userRole === "restaurant_owner" || userRole === "delivery_driver" || userRole === "admin") && (
              <Link to={getDashboardLink()}>
                <Button variant="ghost" size="sm" className="hidden md:inline-flex text-sm">
                  <LayoutDashboard className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/profile" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="hidden sm:inline-flex text-sm"
            >
              Déconnexion
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="text-sm">
              Se connecter
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};
