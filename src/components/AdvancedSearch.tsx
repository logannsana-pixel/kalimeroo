import { useState } from "react";
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
}

export function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "all",
    minPrice: 0,
    maxPrice: 100,
    minRating: 0,
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      query: "",
      category: "all",
      minPrice: 0,
      maxPrice: 100,
      minRating: 0,
    };
    setFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Rechercher un plat, restaurant, ingrédient..."
          className="pl-10"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
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
                  <SelectItem value="Pizza">Pizza</SelectItem>
                  <SelectItem value="Burger">Burger</SelectItem>
                  <SelectItem value="Sushi">Sushi</SelectItem>
                  <SelectItem value="Pâtes">Pâtes</SelectItem>
                  <SelectItem value="Africain">Africain</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Prix: {filters.minPrice}€ - {filters.maxPrice}€
              </label>
              <div className="space-y-4">
                <Slider
                  value={[filters.minPrice]}
                  onValueChange={([value]) => setFilters({ ...filters, minPrice: value })}
                  max={100}
                  step={5}
                />
                <Slider
                  value={[filters.maxPrice]}
                  onValueChange={([value]) => setFilters({ ...filters, maxPrice: value })}
                  max={100}
                  step={5}
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
