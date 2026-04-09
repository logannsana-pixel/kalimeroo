import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterValues {
  sortBy: string;
  maxDeliveryTime: number | null;
  freeDelivery: boolean;
  maxDeliveryFee: number | null;
  minRating: number;
  cuisineTypes: string[];
  openNow: boolean;
}

const CUISINE_TYPES = [
  "Congolaise", "Grillades", "Poulet", "Pizza", "Burger",
  "Sushi", "Végétarien", "Africaine", "Française", "Chinoise"
];

const SORT_OPTIONS = [
  { label: "Pertinence", value: "relevance" },
  { label: "Note", value: "rating" },
  { label: "Temps", value: "delivery_time" },
  { label: "Prix livraison", value: "delivery_fee" },
];

interface FilterSheetProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export const defaultFilters: FilterValues = {
  sortBy: "relevance",
  maxDeliveryTime: null,
  freeDelivery: false,
  maxDeliveryFee: null,
  minRating: 0,
  cuisineTypes: [],
  openNow: false,
};

export function FilterSheet({ filters, onChange }: FilterSheetProps) {
  const [local, setLocal] = useState<FilterValues>(filters);
  const [open, setOpen] = useState(false);

  const activeCount = [
    local.sortBy !== "relevance",
    local.maxDeliveryTime !== null,
    local.freeDelivery,
    local.maxDeliveryFee !== null,
    local.minRating > 0,
    local.cuisineTypes.length > 0,
    local.openNow,
  ].filter(Boolean).length;

  const apply = () => { onChange(local); setOpen(false); };
  const reset = () => { const d = { ...defaultFilters }; setLocal(d); onChange(d); setOpen(false); };

  const toggleCuisine = (c: string) => {
    setLocal(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(c)
        ? prev.cuisineTypes.filter(x => x !== c)
        : [...prev.cuisineTypes, c],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setLocal(filters); }}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-primary/20 text-primary whitespace-nowrap">
          <SlidersHorizontal className="w-3 h-3" />
          Filtres {activeCount > 0 && `(${activeCount})`}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Filtres</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Sort */}
          <div>
            <p className="text-xs font-semibold mb-2">Trier par</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setLocal(p => ({ ...p, sortBy: o.value }))}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    local.sortBy === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <p className="text-xs font-semibold mb-2">Temps de livraison</p>
            <div className="flex flex-wrap gap-2">
              {[null, 30, 45, 60].map(v => (
                <button key={String(v)} onClick={() => setLocal(p => ({ ...p, maxDeliveryTime: v }))}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    local.maxDeliveryTime === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                  {v === null ? "Tous" : `< ${v} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Free delivery + max fee */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Livraison gratuite uniquement</span>
            <Switch checked={local.freeDelivery} onCheckedChange={v => setLocal(p => ({ ...p, freeDelivery: v }))} />
          </div>

          {/* Min rating */}
          <div>
            <p className="text-xs font-semibold mb-2">Note minimum : {local.minRating > 0 ? `${local.minRating}★` : "Toutes"}</p>
            <Slider value={[local.minRating]} min={0} max={5} step={0.5}
              onValueChange={([v]) => setLocal(p => ({ ...p, minRating: v }))} />
          </div>

          {/* Cuisine types */}
          <div>
            <p className="text-xs font-semibold mb-2">Type de cuisine</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map(c => (
                <button key={c} onClick={() => toggleCuisine(c)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    local.cuisineTypes.includes(c) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Open now */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Ouverts maintenant</span>
            <Switch checked={local.openNow} onCheckedChange={v => setLocal(p => ({ ...p, openNow: v }))} />
          </div>
        </div>

        <div className="flex gap-2 pt-2 pb-4">
          <Button variant="outline" onClick={reset} className="flex-1 rounded-full text-xs h-10">
            Réinitialiser
          </Button>
          <Button onClick={apply} className="flex-1 rounded-full text-xs h-10">
            Appliquer {activeCount > 0 && `(${activeCount})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ActiveFilterChips({ filters, onChange }: FilterSheetProps) {
  const chips: { label: string; clear: () => void }[] = [];

  if (filters.sortBy !== "relevance") {
    const label = SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label || filters.sortBy;
    chips.push({ label: `Tri: ${label}`, clear: () => onChange({ ...filters, sortBy: "relevance" }) });
  }
  if (filters.maxDeliveryTime) chips.push({ label: `< ${filters.maxDeliveryTime} min`, clear: () => onChange({ ...filters, maxDeliveryTime: null }) });
  if (filters.freeDelivery) chips.push({ label: "Livraison gratuite", clear: () => onChange({ ...filters, freeDelivery: false }) });
  if (filters.minRating > 0) chips.push({ label: `${filters.minRating}★+`, clear: () => onChange({ ...filters, minRating: 0 }) });
  if (filters.openNow) chips.push({ label: "Ouverts", clear: () => onChange({ ...filters, openNow: false }) });
  filters.cuisineTypes.forEach(c => {
    chips.push({ label: c, clear: () => onChange({ ...filters, cuisineTypes: filters.cuisineTypes.filter(x => x !== c) }) });
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
      {chips.map((chip, i) => (
        <button key={i} onClick={chip.clear}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-2xs font-medium whitespace-nowrap">
          {chip.label}
          <X className="w-2.5 h-2.5" />
        </button>
      ))}
    </div>
  );
}
