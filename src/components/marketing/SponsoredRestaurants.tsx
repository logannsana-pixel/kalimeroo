import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Sparkles } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";

interface SponsoredRestaurant {
  id: string;
  name: string;
  image_url: string | null;
  rating: number | null;
  cuisine_type: string | null;
  delivery_time: string | null;
  delivery_fee: number | null;
}

export function SponsoredRestaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<SponsoredRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsored = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, image_url, rating, cuisine_type, delivery_time, delivery_fee")
          .eq("is_active", true)
          .eq("is_sponsored", true)
          .order("sponsored_position", { ascending: true })
          .limit(4);

        if (data && !error) {
          setRestaurants(data);
        }
      } catch (error) {
        console.error("Error fetching sponsored restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsored();
  }, []);

  if (loading) {
    return (
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-40 h-48 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) return null;

  return (
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm text-foreground">Restaurants en vedette</h2>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Sponsorisé</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {restaurants.map((r) => (
          <Card
            key={r.id}
            className="w-40 flex-shrink-0 border-none rounded-xl overflow-hidden bg-card hover:bg-card/80 active:scale-[0.98] transition-all cursor-pointer"
            onClick={() => navigate(`/restaurant/${r.id}`)}
          >
            <div className="relative h-24">
              <LazyImage
                src={r.image_url || "/placeholder.svg"}
                alt={r.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2">
                <Badge className="bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  Vedette
                </Badge>
              </div>
            </div>
            <CardContent className="p-2.5 space-y-0.5">
              <h3 className="text-xs font-semibold text-foreground line-clamp-1">{r.name}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{r.cuisine_type}</p>
              <div className="flex items-center gap-2 text-[10px] pt-0.5">
                <span className="flex items-center gap-0.5 font-medium text-foreground">
                  <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                  {r.rating?.toFixed(1) || "4.5"}
                </span>
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  {r.delivery_time || "20-30"} min
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
