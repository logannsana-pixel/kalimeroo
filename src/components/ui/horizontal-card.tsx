import * as React from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, ChevronRight, Star, Clock, MapPin } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Skeleton } from "./skeleton";

interface HorizontalCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number | string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success";
  onClick?: () => void;
  showQuantity?: boolean;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onCtaClick?: () => void;
  ctaText?: string;
  rating?: number;
  deliveryTime?: string;
  distance?: string;
  variant?: "compact" | "default" | "large";
  className?: string;
  disabled?: boolean;
}

const sizeConfig = {
  compact: {
    image: "w-14 h-14 min-w-[56px]",
    title: "text-sm",
    subtitle: "text-xs",
    description: "text-xs line-clamp-1",
    gap: "gap-2",
    padding: "p-2",
  },
  default: {
    image: "w-20 h-20 min-w-[80px]",
    title: "text-base",
    subtitle: "text-sm",
    description: "text-sm line-clamp-2",
    gap: "gap-3",
    padding: "p-3",
  },
  large: {
    image: "w-24 h-24 min-w-[96px] md:w-28 md:h-28 md:min-w-[112px]",
    title: "text-lg",
    subtitle: "text-sm",
    description: "text-sm line-clamp-2",
    gap: "gap-4",
    padding: "p-4",
  },
};

const HorizontalCard = React.forwardRef<HTMLDivElement, HorizontalCardProps>(
  (
    {
      imageUrl,
      title,
      subtitle,
      description,
      price,
      badge,
      badgeVariant = "default",
      onClick,
      showQuantity = false,
      quantity = 0,
      onIncrement,
      onDecrement,
      onCtaClick,
      ctaText = "Voir",
      rating,
      deliveryTime,
      distance,
      variant = "default",
      className,
      disabled = false,
    },
    ref
  ) => {
    const config = sizeConfig[variant];

    return (
      <div
        ref={ref}
        onClick={disabled ? undefined : onClick}
        className={cn(
          // Base styles
          "group relative bg-card rounded-2xl md:rounded-3xl border border-border/50",
          "shadow-soft hover:shadow-warm transition-all duration-300",
          // Layout - horizontal on mobile, vertical on desktop
          "flex flex-row md:flex-col",
          config.padding,
          config.gap,
          // Hover effects
          onClick && !disabled && "cursor-pointer hover:scale-[1.02] hover:border-primary/30",
          // Disabled state
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {/* Image */}
        <div
          className={cn(
            config.image,
            "rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0",
            "bg-muted md:w-full md:h-40 md:min-w-full"
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center md:justify-start">
          {/* Badge */}
          {badge && (
            <Badge variant={badgeVariant} className="w-fit mb-1 text-xs">
              {badge}
            </Badge>
          )}

          {/* Title */}
          <h3
            className={cn(
              config.title,
              "font-semibold text-foreground truncate"
            )}
          >
            {title}
          </h3>

          {/* Meta info (rating, time, distance) */}
          {(rating || deliveryTime || distance) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {rating && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)}
                </span>
              )}
              {deliveryTime && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {deliveryTime}
                </span>
              )}
              {distance && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {distance}
                </span>
              )}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className={cn(config.subtitle, "text-muted-foreground mt-0.5")}>
              {subtitle}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className={cn(config.description, "text-muted-foreground mt-1")}>
              {description}
            </p>
          )}

          {/* Price - visible on mobile inline, on desktop at bottom */}
          {price && (
            <p className="font-bold text-primary mt-1 md:mt-2">
              {typeof price === "number" ? `${price.toLocaleString()} FCFA` : price}
            </p>
          )}
        </div>

        {/* Actions - right side on mobile, bottom on desktop */}
        <div className="flex items-center md:items-stretch md:w-full md:mt-2 flex-shrink-0">
          {showQuantity ? (
            <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement?.();
                }}
                disabled={quantity <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-6 text-center font-semibold text-sm">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement?.();
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : onCtaClick ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full md:w-full"
              onClick={(e) => {
                e.stopPropagation();
                onCtaClick();
              }}
            >
              {ctaText}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground md:hidden" />
          )}
        </div>
      </div>
    );
  }
);
HorizontalCard.displayName = "HorizontalCard";

// Skeleton variant
const HorizontalCardSkeleton = ({
  variant = "default",
  className,
}: {
  variant?: "compact" | "default" | "large";
  className?: string;
}) => {
  const config = sizeConfig[variant];

  return (
    <div
      className={cn(
        "flex flex-row md:flex-col bg-card rounded-2xl md:rounded-3xl border border-border/50",
        config.padding,
        config.gap,
        className
      )}
    >
      {/* Image skeleton */}
      <Skeleton
        className={cn(
          config.image,
          "rounded-xl md:rounded-2xl md:w-full md:h-40"
        )}
      />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Action skeleton */}
      <div className="flex items-center md:w-full md:mt-2">
        <Skeleton className="h-8 w-8 rounded-full md:h-9 md:w-full md:rounded-xl" />
      </div>
    </div>
  );
};

export { HorizontalCard, HorizontalCardSkeleton };
export type { HorizontalCardProps };
