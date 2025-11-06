import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  };
}

interface ReviewsListProps {
  restaurantId: string;
}

export const ReviewsList = ({ restaurantId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.user_id)
            .single();

          return {
            ...review,
            profiles: profile || { full_name: null }
          };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Calculate average rating
      if (reviewsWithProfiles && reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, review) => sum + review.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des avis...</div>;
  }

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-1">
            <Star className="w-6 h-6 fill-primary text-primary" />
            <span className="text-2xl font-bold">{averageRating}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Basé sur {reviews.length} avis
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Aucun avis pour le moment. Soyez le premier à laisser un avis !
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {review.profiles?.full_name || "Utilisateur"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "PPP", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};