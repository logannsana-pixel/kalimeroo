import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Pages where floating cart should appear
const SHOPPING_PAGES = ['/restaurants', '/restaurant'];

export function FloatingCart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = useAuth();
  const { getCartCount } = useCart();
  
  const cartCount = getCartCount();

  // Only show for customers on shopping pages
  const isShoppingPage = SHOPPING_PAGES.some(page => location.pathname.startsWith(page));
  const shouldShow = user && userRole === 'customer' && isShoppingPage && cartCount > 0;

  if (!shouldShow) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className={cn(
        "fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40",
        "w-14 h-14 rounded-full",
        "bg-primary/80 backdrop-blur-sm",
        "flex items-center justify-center",
        "shadow-lg hover:bg-primary/90 transition-all duration-300",
        "animate-scale-in"
      )}
    >
      <ShoppingBag className="h-6 w-6 text-primary-foreground" />
      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
        {cartCount}
      </span>
    </button>
  );
}
