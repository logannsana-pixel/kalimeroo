import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FavoritesButtonProps {
  restaurantId: string;
  variant?: "default" | "ghost";
}

export function FavoritesButton({ restaurantId, variant = "ghost" }: FavoritesButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, restaurantId]);

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter des favoris",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de retirer des favoris",
          variant: "destructive",
        });
      } else {
        setIsFavorite(false);
        toast({
          title: "Retiré des favoris",
          description: "Le restaurant a été retiré de vos favoris",
        });
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, restaurant_id: restaurantId });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter aux favoris",
          variant: "destructive",
        });
      } else {
        setIsFavorite(true);
        toast({
          title: "Ajouté aux favoris",
          description: "Le restaurant a été ajouté à vos favoris",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className="transition-all"
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          isFavorite ? "fill-primary text-primary" : ""
        }`}
      />
    </Button>
  );
}
