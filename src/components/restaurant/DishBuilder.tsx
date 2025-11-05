import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ImageUpload } from "@/components/ImageUpload";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DishData {
  name: string;
  description: string;
  category: string;
  price: string;
  is_available: boolean;
  image?: File;
}

interface DishBuilderProps {
  initialData?: Partial<DishData>;
  onSubmit: (data: DishData, image: File | null) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function DishBuilder({ initialData, onSubmit, onCancel, isEditing }: DishBuilderProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<DishData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    price: initialData?.price || "",
    is_available: initialData?.is_available ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DishData, string>>>({});

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof DishData, string>> = {};
    
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.category.trim()) newErrors.category = "La catégorie est requise";
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Le prix doit être supérieur à 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData, imageFile);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          Étape {step} sur {totalSteps}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Détails de base</h3>
            <p className="text-sm text-muted-foreground">
              Commencez par les informations essentielles de votre plat
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom du plat *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Poulet Moambé"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Plats principaux, Entrées, Desserts..."
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Prix de base (FCFA) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="5000"
            />
            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre plat..."
              rows={4}
            />
          </div>

          <Button type="button" onClick={handleNext} className="w-full">
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Photo du plat</h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez une image appétissante de votre plat
            </p>
          </div>

          <ImageUpload
            label="Image du plat"
            onImageChange={setImageFile}
            currentImage={initialData?.image as any}
          />

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="available" className="font-semibold">Disponibilité</Label>
              <p className="text-sm text-muted-foreground">
                Le plat est-il disponible à la commande ?
              </p>
            </div>
            <Switch
              id="available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button type="button" onClick={() => setStep(3)} className="flex-1">
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Aperçu et confirmation</h3>
            <p className="text-sm text-muted-foreground">
              Vérifiez les informations avant de publier
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div>
                <h3 className="text-xl font-bold">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">{formData.category}</p>
              </div>

              {formData.description && (
                <p className="text-sm">{formData.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold">{Number(formData.price).toFixed(0)} FCFA</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  formData.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {formData.is_available ? 'Disponible' : 'Indisponible'}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                "Enregistrement..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditing ? "Mettre à jour" : "Publier le plat"}
                </>
              )}
            </Button>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}
