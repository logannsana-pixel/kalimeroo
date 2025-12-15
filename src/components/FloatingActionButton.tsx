import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingBag, X, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Pages where FAB should NOT appear (isolated dashboards)
const HIDDEN_PAGES = ['/admin-dashboard', '/restaurant-dashboard', '/delivery-dashboard'];

const FloatingActionButton = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { getCartCount } = useCart();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartCount = getCartCount();
  
  // Hide on dashboard pages
  const shouldHide = HIDDEN_PAGES.some(page => location.pathname.startsWith(page));
  if (shouldHide) return null;

  // Show cart only on shopping pages for customers
  const isShoppingPage = ['/restaurants', '/restaurant'].some(page => location.pathname.startsWith(page));
  const showCart = user && userRole === 'customer' && isShoppingPage && cartCount > 0;

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      const userType = userRole || 'visitor';
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || null,
          subject: subject.trim(),
          description: message.trim(),
          user_type: userType,
          category: 'general',
          priority: 'medium'
        });

      if (error) throw error;

      toast.success('Message envoyé !');
      setSubject('');
      setMessage('');
      setIsChatOpen(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('openSupportChat', handleOpenChat);
    return () => window.removeEventListener('openSupportChat', handleOpenChat);
  }, []);

  return (
    <>
      {/* Main FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {/* Cart Button - only when shopping */}
        {showCart && !isChatOpen && (
          <button
            onClick={() => navigate('/cart')}
            className={cn(
              "w-12 h-12 rounded-full",
              "bg-secondary text-secondary-foreground",
              "flex items-center justify-center",
              "shadow-md hover:shadow-lg transition-all",
              "animate-in slide-in-from-right-2"
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </button>
        )}

        {/* Chat/Help Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "w-12 h-12 rounded-full",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "shadow-md hover:shadow-lg transition-all"
          )}
        >
          {isChatOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-72 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-primary p-3">
            <h3 className="text-primary-foreground font-medium text-sm">Aide</h3>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2">
            {/* Quick Link to FAQ */}
            <button
              onClick={() => {
                setIsChatOpen(false);
                navigate('/help');
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">FAQ & Aide</span>
            </button>

            <div className="border-t border-border pt-2">
              <p className="text-[10px] text-muted-foreground mb-2">Ou envoyez un message :</p>
              
              <Input
                placeholder="Sujet"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mb-2 h-8 text-xs"
              />
              
              <Textarea
                placeholder="Votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[60px] text-xs resize-none"
              />
              
              <Button
                onClick={handleSubmitTicket}
                disabled={isSubmitting}
                className="w-full mt-2 h-8 text-xs"
                size="sm"
              >
                {isSubmitting ? 'Envoi...' : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;
