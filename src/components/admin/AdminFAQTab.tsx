import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const iconOptions = [
  { value: 'ShoppingBag', label: 'Panier' },
  { value: 'Truck', label: 'Livraison' },
  { value: 'CreditCard', label: 'Paiement' },
  { value: 'User', label: 'Utilisateur' },
  { value: 'HelpCircle', label: 'Aide' },
];

const AdminFAQTab = () => {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', description: '', icon: 'HelpCircle' });
  const [newItemForm, setNewItemForm] = useState({ category_id: '', question: '', answer: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('faq_categories').select('*').order('display_order'),
        supabase.from('faq_items').select('*').order('display_order'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryForm.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      const { error } = await supabase.from('faq_categories').insert({
        name: newCategoryForm.name,
        description: newCategoryForm.description || null,
        icon: newCategoryForm.icon,
        display_order: categories.length,
      });

      if (error) throw error;

      toast.success('Catégorie créée');
      setNewCategoryForm({ name: '', description: '', icon: 'HelpCircle' });
      setIsAddingCategory(false);
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateCategory = async (category: FAQCategory) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .update({
          name: category.name,
          description: category.description,
          icon: category.icon,
          is_active: category.is_active,
        })
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Catégorie mise à jour');
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et toutes ses questions ?')) return;

    try {
      const { error } = await supabase.from('faq_categories').delete().eq('id', id);
      if (error) throw error;

      toast.success('Catégorie supprimée');
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddItem = async () => {
    if (!newItemForm.category_id || !newItemForm.question.trim() || !newItemForm.answer.trim()) {
      toast.error('Tous les champs sont requis');
      return;
    }

    try {
      const categoryItems = items.filter(i => i.category_id === newItemForm.category_id);
      const { error } = await supabase.from('faq_items').insert({
        category_id: newItemForm.category_id,
        question: newItemForm.question,
        answer: newItemForm.answer,
        display_order: categoryItems.length,
      });

      if (error) throw error;

      toast.success('Question créée');
      setNewItemForm({ category_id: '', question: '', answer: '' });
      setIsAddingItem(false);
      fetchData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateItem = async (item: FAQItem) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({
          question: item.question,
          answer: item.answer,
          is_active: item.is_active,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Question mise à jour');
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;

    try {
      const { error } = await supabase.from('faq_items').delete().eq('id', id);
      if (error) throw error;

      toast.success('Question supprimée');
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestion FAQ</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsAddingCategory(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Catégorie
          </Button>
          <Button size="sm" onClick={() => setIsAddingItem(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Question
          </Button>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="space-y-4">
        {categories.map(category => (
          <Card key={category.id} className={!category.is_active ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {category.name}
                  {!category.is_active && (
                    <span className="text-xs text-muted-foreground">(Inactif)</span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {items
                  .filter(item => item.category_id === category.id)
                  .map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg bg-muted/50 ${
                        !item.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.question}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {items.filter(item => item.category_id === category.id).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aucune question dans cette catégorie
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Category Modal */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nom de la catégorie"
              value={newCategoryForm.name}
              onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Description (optionnel)"
              value={newCategoryForm.description}
              onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
            />
            <Select
              value={newCategoryForm.icon}
              onValueChange={(val) => setNewCategoryForm(prev => ({ ...prev, icon: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Icône" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-3">
              <Input
                placeholder="Nom"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <Input
                placeholder="Description"
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              <Select
                value={editingCategory.icon || 'HelpCircle'}
                onValueChange={(val) => setEditingCategory(prev => prev ? { ...prev, icon: val } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <span className="text-sm">Actif</span>
                <Switch
                  checked={editingCategory.is_active}
                  onCheckedChange={(val) => setEditingCategory(prev => prev ? { ...prev, is_active: val } : null)}
                />
              </div>
              <Button onClick={() => handleUpdateCategory(editingCategory)} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle question</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={newItemForm.category_id}
              onValueChange={(val) => setNewItemForm(prev => ({ ...prev, category_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Question"
              value={newItemForm.question}
              onChange={(e) => setNewItemForm(prev => ({ ...prev, question: e.target.value }))}
            />
            <Textarea
              placeholder="Réponse"
              value={newItemForm.answer}
              onChange={(e) => setNewItemForm(prev => ({ ...prev, answer: e.target.value }))}
              className="min-h-[100px]"
            />
            <Button onClick={handleAddItem} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la question</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-3">
              <Input
                placeholder="Question"
                value={editingItem.question}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, question: e.target.value } : null)}
              />
              <Textarea
                placeholder="Réponse"
                value={editingItem.answer}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, answer: e.target.value } : null)}
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">Actif</span>
                <Switch
                  checked={editingItem.is_active}
                  onCheckedChange={(val) => setEditingItem(prev => prev ? { ...prev, is_active: val } : null)}
                />
              </div>
              <Button onClick={() => handleUpdateItem(editingItem)} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQTab;
