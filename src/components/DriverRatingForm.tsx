import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DriverRatingFormProps {
  orderId: string;
  driverId: string;
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DriverRatingForm({ 
  orderId, 
  driverId, 
  driverName, 
  isOpen, 
  onClose, 
  onSuccess 
}: DriverRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez donner une note");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Insert review
      const { error: reviewError } = await supabase
        .from("driver_reviews")
        .insert({
          driver_id: driverId,
          user_id: user.id,
          order_id: orderId,
          rating,
          comment: comment.trim() || null
        });

      if (reviewError) throw reviewError;

      // Update driver's average rating
      const { data: reviews } = await supabase
        .from("driver_reviews")
        .select("rating")
        .eq("driver_id", driverId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await supabase
          .from("profiles")
          .update({ 
            driver_rating: avgRating,
            driver_reviews_count: reviews.length
          })
          .eq("id", driverId);
      }

      toast.success("Merci pour votre avis !");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.code === '23505') {
        toast.error("Vous avez déjà noté ce livreur pour cette commande");
      } else {
        toast.error("Erreur lors de l'envoi de l'avis");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Noter le livreur</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Driver Info */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold">{driverName}</p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors",
                    (hoverRating || rating) >= star 
                      ? "text-yellow-500 fill-yellow-500" 
                      : "text-muted-foreground"
                  )} 
                />
              </button>
            ))}
          </div>

          {/* Rating Label */}
          <p className="text-center text-sm text-muted-foreground">
            {rating === 1 && "Très mauvais"}
            {rating === 2 && "Mauvais"}
            {rating === 3 && "Correct"}
            {rating === 4 && "Bien"}
            {rating === 5 && "Excellent !"}
          </p>

          {/* Comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Un commentaire ? (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Plus tard
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}