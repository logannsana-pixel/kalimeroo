import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Loader2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const RestaurantFeedbackTab = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1-5 stars
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, rating')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      const { data: reviewsData } = await supabase
        .from('anonymous_reviews')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        setReviews(reviewsData);

        // Calculate stats
        const distribution = [0, 0, 0, 0, 0];
        let totalRating = 0;

        reviewsData.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            distribution[r.rating - 1]++;
            totalRating += r.rating;
          }
        });

        setStats({
          averageRating: reviewsData.length > 0 ? totalRating / reviewsData.length : restaurant.rating || 0,
          totalReviews: reviewsData.length,
          ratingDistribution: distribution
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Avis clients</h2>
        <Badge variant="secondary">{stats.totalReviews} avis</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Note moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${star <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Basé sur {stats.totalReviews} avis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating - 1];
              const percentage = stats.totalReviews > 0 
                ? (count / stats.totalReviews) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 text-sm">{rating} ★</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="w-12 text-sm text-muted-foreground text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avis récents
          </CardTitle>
          <CardDescription>
            Les commentaires de vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun avis pour le moment</p>
              <p className="text-sm">Les avis apparaîtront après les premières livraisons</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="text-sm">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Pas de commentaire</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
