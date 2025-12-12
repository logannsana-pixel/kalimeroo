import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Pages where floating cart should appear
const SHOPPING_PAGES = ['/restaurants', '/restaurant'];

export function FloatingCart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = useAuth();
  const { getCartCount, getCartTotal } = useCart();
  
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  // Only show for customers on shopping pages
  const isShoppingPage = SHOPPING_PAGES.some(page => location.pathname.startsWith(page));
  const shouldShow = user && userRole === 'customer' && isShoppingPage && cartCount > 0;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-40 animate-slide-up">
      <Button
        onClick={() => navigate('/cart')}
        className={cn(
          "w-full md:w-auto h-14 md:h-12 rounded-2xl",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-glow hover:shadow-hover transition-all duration-300",
          "flex items-center justify-between md:justify-center gap-3 px-5",
          "backdrop-blur-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </div>
          <span className="font-semibold">Voir le panier</span>
        </div>
        <span className="font-bold text-lg">
          {cartTotal.toLocaleString('fr-FR')} FCFA
        </span>
      </Button>
    </div>
  );
}
