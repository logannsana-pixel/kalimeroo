import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
  display_order: number;
}

const categories = [
  { value: "side", label: "Accompagnement" },
  { value: "drink", label: "Boisson" },
  { value: "sauce", label: "Sauce" },
  { value: "extra", label: "Extra" },
  { value: "dessert", label: "Dessert" },
];

export function BundlesTab() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "side",
    price: "0",
    is_available: true,
  });

  useEffect(() => {
    fetchRestaurantAndBundles();
  }, [user]);

  const fetchRestaurantAndBundles = async () => {
    if (!user) return;

    try {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);

        const { data: bundlesData, error } = await supabase
          .from("bundles")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .order("category", { ascending: true })
          .order("display_order", { ascending: true });

        if (error) throw error;
        setBundles(bundlesData || []);
      }
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Erreur lors du chargement des bundles");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "side",
      price: "0",
      is_available: true,
    });
    setEditingBundle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bundleData = {
        restaurant_id: restaurantId,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
      };

      if (editingBundle) {
        const { error } = await supabase
          .from("bundles")
          .update(bundleData)
          .eq("id", editingBundle.id);

        if (error) throw error;
        toast.success("Bundle modifié avec succès");
      } else {
        const { error } = await supabase
          .from("bundles")
          .insert([bundleData]);

        if (error) throw error;
        toast.success("Bundle créé avec succès");
      }

      setDialogOpen(false);
      resetForm();
      fetchRestaurantAndBundles();
    } catch (error) {
      console.error("Error saving bundle:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || "",
      category: bundle.category,
      price: bundle.price.toString(),
      is_available: bundle.is_available,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bundle ?")) return;

    try {
      const { error } = await supabase
        .from("bundles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Bundle supprimé");
      fetchRestaurantAndBundles();
    } catch (error) {
      console.error("Error deleting bundle:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleAvailability = async (bundle: Bundle) => {
    try {
      const { error } = await supabase
        .from("bundles")
        .update({ is_available: !bundle.is_available })
        .eq("id", bundle.id);

      if (error) throw error;
      toast.success(bundle.is_available ? "Bundle désactivé" : "Bundle activé");
      fetchRestaurantAndBundles();
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const groupedBundles = bundles.reduce((acc, bundle) => {
    if (!acc[bundle.category]) acc[bundle.category] = [];
    acc[bundle.category].push(bundle);
    return acc;
  }, {} as Record<string, Bundle[]>);

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bundles Réutilisables</h2>
          <p className="text-muted-foreground text-sm">
            Créez des accompagnements, boissons et extras réutilisables dans tout votre menu
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBundle ? "Modifier" : "Créer"} un Bundle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prix (FCFA) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="available">Disponible</Label>
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingBundle ? "Mettre à jour" : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bundles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de bundles réutilisables
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier bundle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const categoryBundles = groupedBundles[cat.value] || [];
            if (categoryBundles.length === 0) return null;

            return (
              <div key={cat.value}>
                <h3 className="text-lg font-semibold mb-3">{cat.label}s</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryBundles.map(bundle => (
                    <Card key={bundle.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{bundle.name}</CardTitle>
                            {bundle.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {bundle.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={bundle.is_available ? "default" : "secondary"}>
                            {bundle.is_available ? "Disponible" : "Indisponible"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">{Number(bundle.price).toFixed(0)} FCFA</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleAvailability(bundle)}
                            >
                              <Switch checked={bundle.is_available} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(bundle)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(bundle.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
