import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp } from "lucide-react";

interface RestaurantCardProps {
  imageUrl?: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

const RestaurantCard = React.forwardRef<HTMLDivElement, RestaurantCardProps>(
  ({ imageUrl, name, rating, reviewCount, badge, onClick, className }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="restaurant-card"
        onClick={onClick}
        className={cn(
          "group cursor-pointer transition-all duration-300",
          "hover:scale-[1.02] active:scale-[0.98]",
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {badge && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
              {badge}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-1">
          <h3 className="font-semibold text-foreground text-base leading-tight mb-1 line-clamp-1">
            {name}
          </h3>
          {(rating !== undefined || reviewCount !== undefined) && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>
                {rating ? `${rating}%` : ""}
                {reviewCount !== undefined && ` (${reviewCount > 500 ? "500+" : reviewCount})`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
RestaurantCard.displayName = "RestaurantCard";

const RestaurantCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse", className)}>
    <Skeleton className="aspect-[4/3] rounded-2xl mb-3" />
    <div className="px-1">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export { RestaurantCard, RestaurantCardSkeleton };
