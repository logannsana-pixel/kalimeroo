import { useState } from 'react';
import { MessageCircle, X, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

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

      toast.success('Message envoyé ! Notre équipe vous répondra bientôt.');
      setSubject('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-200 hover:scale-105"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-80 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-primary p-4">
            <h3 className="text-primary-foreground font-semibold">Besoin d'aide ?</h3>
            <p className="text-primary-foreground/80 text-xs">Notre équipe est là pour vous</p>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Quick Links */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/help');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <HelpCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">FAQ & Aide</p>
                <p className="text-xs text-muted-foreground">Trouvez des réponses rapides</p>
              </div>
            </button>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">Ou envoyez-nous un message :</p>
              
              <Input
                placeholder="Sujet"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mb-2 h-9 text-sm"
              />
              
              <Textarea
                placeholder="Décrivez votre problème..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              
              <Button
                onClick={handleSubmitTicket}
                disabled={isSubmitting}
                className="w-full mt-2 h-9"
                size="sm"
              >
                {isSubmitting ? (
                  'Envoi...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
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

export default FloatingChatButton;
