import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuItemCardProps {
  imageUrl?: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  onClick?: () => void;
  onAdd?: () => void;
  className?: string;
}

const MenuItemCard = React.forwardRef<HTMLDivElement, MenuItemCardProps>(
  ({ imageUrl, name, description, price, originalPrice, discount, onClick, onAdd, className }, ref) => {
    const handleAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAdd?.();
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex gap-3 py-4 cursor-pointer transition-all duration-200",
          "hover:bg-muted/50 -mx-2 px-2 rounded-2xl",
          className
        )}
      >
        {/* Image */}
        <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover"
          />
          {discount && (
            <Badge className="absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">
              {discount}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-medium text-foreground text-sm leading-tight mb-1 line-clamp-1">
            {name}
          </h4>
          {description && (
            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary text-sm">
              {price.toLocaleString('fr-FR')} FCFA
            </span>
            {originalPrice && (
              <span className="text-muted-foreground text-xs line-through">
                {originalPrice.toLocaleString('fr-FR')} FCFA
              </span>
            )}
          </div>
        </div>

        {/* Add Button */}
        <div className="flex-shrink-0 flex items-center">
          <button
            onClick={handleAddClick}
            className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);
MenuItemCard.displayName = "MenuItemCard";

const MenuItemCardSkeleton = () => (
  <div className="flex gap-3 py-4 animate-pulse">
    <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 flex flex-col justify-center">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
  </div>
);

export { MenuItemCard, MenuItemCardSkeleton };
