import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DishBuilder } from "@/components/restaurant/DishBuilder";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  is_available: boolean;
}

export const MenuTab = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchRestaurantAndMenu();
  }, []);

  const fetchRestaurantAndMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurantData) return;
      setRestaurantId(restaurantData.id);

      const { data: menuData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(menuData || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error("Erreur lors du chargement du menu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (dishData: any, imageFile: File | null) => {
    if (!restaurantId) return;

    try {
      let imageUrl = editingItem?.image_url || "";

      // Upload image if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const itemData = {
        name: dishData.name,
        description: dishData.description || null,
        price: parseFloat(dishData.price),
        category: dishData.category || null,
        image_url: imageUrl || null,
        is_available: dishData.is_available,
        restaurant_id: restaurantId
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success("Plat modifié avec succès");
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);
        
        if (error) throw error;
        toast.success("Plat ajouté avec succès");
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      fetchRestaurantAndMenu();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Plat supprimé");
      fetchRestaurantAndMenu();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success("Disponibilité mise à jour");
      fetchRestaurantAndMenu();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Gestion du menu</h2>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Ajouter un plat
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingItem(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Modifier le plat' : 'Créer un nouveau plat'}</DialogTitle>
            </DialogHeader>
            <DishBuilder
              initialData={editingItem ? {
                name: editingItem.name,
                description: editingItem.description || "",
                category: editingItem.category || "",
                price: editingItem.price.toString(),
                is_available: editingItem.is_available,
                image: editingItem.image_url as any
              } : undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingItem(null);
              }}
              isEditing={!!editingItem}
            />
          </DialogContent>
        </Dialog>
      </div>

      {menuItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Aucun plat dans votre menu</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Ajouter votre premier plat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex justify-between items-start">
                  <span className="truncate pr-2">{item.name}</span>
                  <Switch
                    checked={item.is_available}
                    onCheckedChange={() => toggleAvailability(item.id, item.is_available)}
                    className="scale-90"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{item.description}</p>
                {item.category && (
                  <p className="text-[10px] text-muted-foreground mb-2">Catégorie: {item.category}</p>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-xs">{item.price.toFixed(0)} F</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
