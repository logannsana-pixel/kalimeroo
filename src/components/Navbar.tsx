import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Utensils, LayoutDashboard, Menu, X, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const navigate = useNavigate();
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

  const getDashboardLabel = () => {
    switch (userRole) {
      case "restaurant_owner":
        return "Mon Restaurant";
      case "delivery_driver":
        return "Mes Livraisons";
      case "admin":
        return "Administration";
      case "customer":
        return "Mes Commandes";
      default:
        return "Dashboard";
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <span className="font-bold text-lg hidden sm:block">DeliverEat</span>
        </Link>

        {/* Desktop Navigation - Center */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Button>
          </Link>
          <Link to="/restaurants">
            <Button variant="ghost" size="sm">
              <Utensils className="h-4 w-4 mr-2" />
              Restaurants
            </Button>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Cart - Always visible for customers */}
              {userRole === "customer" && (
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {getDashboardLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Mon Profil
                  </DropdownMenuItem>
                  {userRole === "customer" && (
                    <DropdownMenuItem onClick={() => navigate("/orders")}>
                      <Utensils className="h-4 w-4 mr-2" />
                      Mes Commandes
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/restaurants" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Explorer
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Se connecter</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
