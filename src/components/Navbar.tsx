import { Link } from "react-router-dom";
import { ShoppingCart, User, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            DeliverEat
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/restaurants">
                <Button variant="ghost">Restaurants</Button>
              </Link>
              <Link to="/cart">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button onClick={signOut} variant="outline">
                Déconnexion
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="hero">Se connecter</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
