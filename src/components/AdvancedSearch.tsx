import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface SearchFilters {
  query: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const defaultFilters: SearchFilters = {
  query: "",
  category: "all",
  minPrice: 0,
  maxPrice: 50000,
  minRating: 0,
};

export function AdvancedSearch({ onSearch, initialFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters?.query, initialFilters?.category]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  const handleInputChange = (value: string) => {
    const newFilters = { ...filters, query: value };
    setFilters(newFilters);
    // Auto-search on input change
    onSearch(newFilters);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Rechercher un plat, restaurant, ville..."
          className="pl-10 h-11"
        />
      </div>
      
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-11 w-11">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filtres avancés</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Catégorie</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Africaine">Africaine</SelectItem>
                  <SelectItem value="Pizza">Pizza</SelectItem>
                  <SelectItem value="Fast Food">Fast Food</SelectItem>
                  <SelectItem value="Chinoise">Chinoise</SelectItem>
                  <SelectItem value="Indienne">Indienne</SelectItem>
                  <SelectItem value="Italienne">Italienne</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Prix: {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} FCFA
              </label>
              <div className="space-y-4">
                <Slider
                  value={[filters.minPrice]}
                  onValueChange={([value]) => setFilters({ ...filters, minPrice: value })}
                  max={50000}
                  step={1000}
                />
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={([value]) => setFilters({ ...filters, maxPrice: value })}
                  max={50000}
                  step={1000}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Note minimum: {filters.minRating} ⭐
              </label>
              <Slider
                value={[filters.minRating]}
                onValueChange={([value]) => setFilters({ ...filters, minRating: value })}
                max={5}
                step={0.5}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSearch} className="flex-1">
                Appliquer
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
