import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Utensils, LayoutDashboard, Home, Search, MapPin, Menu, Bell, Settings, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/contexts/LocationContext";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { getCartCount } = useCart();
  const { district, city, openModal } = useLocation();
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
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border/30">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl shadow-glow transition-transform group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-xl">K</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight">
              <span className="text-gradient-primary">KALI</span>
              <span className="text-foreground">MERO</span>
            </span>
          </div>
        </Link>

        {/* Location Selector - Center (Desktop) */}
        <button 
          onClick={openModal}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full transition-all group"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {district || "Choisir une adresse"}
          </span>
          <span className="text-xs text-muted-foreground">▼</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-secondary">
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
          <Link to="/restaurants">
            <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-secondary">
              <Utensils className="h-4 w-4" />
              Restaurants
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-secondary opacity-50 cursor-not-allowed" disabled>
            🛒 Magasins
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">Bientôt</span>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-secondary opacity-50 cursor-not-allowed" disabled>
            💊 Pharmacies
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">Bientôt</span>
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Affiliate Gift Icon - Only for customers */}
              {userRole === "customer" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/affiliate">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-full hover:bg-primary/10 relative"
                      >
                        <Gift className="h-5 w-5 text-primary" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Programme de parrainage</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Cart - Only for customers */}
              {userRole === "customer" && (
                <Link to="/cart" className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full hover:bg-primary/10 relative"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-glow animate-scale-in">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-soft"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-float">
                  <DropdownMenuItem 
                    onClick={() => navigate(getDashboardLink())}
                    className="rounded-xl py-3 cursor-pointer"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-3 text-primary" />
                    {getDashboardLabel()}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/profile")}
                    className="rounded-xl py-3 cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-3 text-primary" />
                    Mon Profil
                  </DropdownMenuItem>
                  {userRole === "customer" && (
                    <DropdownMenuItem 
                      onClick={() => navigate("/orders")}
                      className="rounded-xl py-3 cursor-pointer"
                    >
                      <Utensils className="h-4 w-4 mr-3 text-primary" />
                      Mes Commandes
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => navigate("/enable-alerts")}
                    className="rounded-xl py-3 cursor-pointer"
                  >
                    <Bell className="h-4 w-4 mr-3 text-primary" />
                    Alertes & Sons
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem 
                    onClick={signOut} 
                    className="rounded-xl py-3 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/restaurants" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-full gap-2">
                  <Search className="h-4 w-4" />
                  Explorer
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="rounded-full px-6 shadow-glow btn-playful">
                  Se connecter
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 rounded-l-3xl">
              <div className="flex flex-col gap-4 mt-8">
                {/* Mobile Location */}
                <button 
                  onClick={openModal}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {district ? district : "Choisir une adresse"}
                    </p>
                    <p className="text-xs text-muted-foreground">{city || "Votre localisation"}</p>
                  </div>
                </button>

                {/* Mobile Nav Links */}
                <Link to="/" className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-2xl transition-colors">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-medium">Accueil</span>
                </Link>
                <Link to="/restaurants" className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-2xl transition-colors">
                  <Utensils className="h-5 w-5 text-primary" />
                  <span className="font-medium">Restaurants</span>
                </Link>
                
                {user && (
                  <>
                    <Link to={getDashboardLink()} className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-2xl transition-colors">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      <span className="font-medium">{getDashboardLabel()}</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-muted/50 rounded-2xl transition-colors">
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">Mon Profil</span>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
