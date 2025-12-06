import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function RefreshButton({ onClick, loading = false, className, size = "icon" }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={loading}
      className={cn("", className)}
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {size !== "icon" && <span className="ml-2">Actualiser</span>}
    </Button>
  );
}
