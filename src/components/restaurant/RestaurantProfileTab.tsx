import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  cuisine_type: string | null;
  image_url: string | null;
  is_active: boolean;
  delivery_fee: number;
  min_order: number;
  delivery_time: string;
}

export const RestaurantProfileTab = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    cuisine_type: '',
    image_url: '',
    is_active: true,
    delivery_fee: '',
    min_order: '',
    delivery_time: ''
  });

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setRestaurant(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          address: data.address,
          phone: data.phone || '',
          cuisine_type: data.cuisine_type || '',
          image_url: data.image_url || '',
          is_active: data.is_active,
          delivery_fee: data.delivery_fee.toString(),
          min_order: data.min_order.toString(),
          delivery_time: data.delivery_time
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      let imageUrl = formData.image_url;

      // Upload image if file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          phone: formData.phone || null,
          cuisine_type: formData.cuisine_type || null,
          image_url: imageUrl || null,
          is_active: formData.is_active,
          delivery_fee: parseFloat(formData.delivery_fee),
          min_order: parseFloat(formData.min_order),
          delivery_time: formData.delivery_time
        })
        .eq('id', restaurant.id);

      if (error) throw error;
      toast.success("Profil mis à jour avec succès");
      fetchRestaurant();
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (!restaurant) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Aucun restaurant associé à votre compte</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">Profil du restaurant</h2>
      <Card>
        <CardHeader>
          <CardTitle>Informations du restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du restaurant *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cuisine_type">Type de cuisine</Label>
                <Input
                  id="cuisine_type"
                  value={formData.cuisine_type}
                  onChange={(e) => setFormData({...formData, cuisine_type: e.target.value})}
                  placeholder="Ex: Congolais, Italien"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <ImageUpload
              label="Logo / Image du restaurant"
              onImageChange={setImageFile}
              currentImage={formData.image_url}
            />

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery_fee">Frais de livraison (FCFA)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="min_order">Commande minimum (FCFA)</Label>
                <Input
                  id="min_order"
                  type="number"
                  step="0.01"
                  value={formData.min_order}
                  onChange={(e) => setFormData({...formData, min_order: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="delivery_time">Temps de livraison</Label>
                <Input
                  id="delivery_time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                  placeholder="30-45 min"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Restaurant ouvert</Label>
            </div>

            <Button type="submit" className="w-full">
              Enregistrer les modifications
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
