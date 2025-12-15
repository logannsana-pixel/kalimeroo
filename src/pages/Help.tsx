import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, ShoppingBag, Truck, CreditCard, User, HelpCircle, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  display_order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Truck,
  CreditCard,
  User,
  HelpCircle,
};

const Help = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('faq_categories')
          .select('*')
          .order('display_order'),
        supabase
          .from('faq_items')
          .select('*')
          .order('display_order')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery
      ? item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? item.category_id === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const getItemsForCategory = (categoryId: string) => {
    return filteredItems.filter(item => item.category_id === categoryId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Aide & FAQ</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Category Filters */}
        {loading ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-28 rounded-full flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Tout
            </button>
            {categories.map(category => {
              const IconComponent = iconMap[category.icon || 'HelpCircle'] || HelpCircle;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => {
              const categoryItems = getItemsForCategory(category.id);
              if (categoryItems.length === 0) return null;

              const IconComponent = iconMap[category.icon || 'HelpCircle'] || HelpCircle;

              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <h2 className="text-base font-semibold">{category.name}</h2>
                  </div>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    {categoryItems.map(item => (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="bg-card rounded-xl border border-border px-4"
                      >
                        <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-3">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun résultat trouvé</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contact Support CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Vous n'avez pas trouvé votre réponse ?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Notre équipe support est disponible pour vous aider
              </p>
              <Button
                size="sm"
                className="mt-3 h-8 text-xs"
                onClick={() => {
                  // Trigger floating chat
                  const event = new CustomEvent('openSupportChat');
                  window.dispatchEvent(event);
                }}
              >
                Contacter le support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
