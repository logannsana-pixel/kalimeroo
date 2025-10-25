import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { allDistricts } from "@/data/congoDistricts";

interface DistrictSelectorProps {
  onSelect: (district: string, city: string) => void;
  selectedDistrict?: string;
}

export const DistrictSelector = ({ onSelect, selectedDistrict }: DistrictSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-background/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {selectedDistrict || "Sélectionnez votre quartier..."}
            </span>
          </div>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un quartier..." />
          <CommandList>
            <CommandEmpty>Aucun quartier trouvé.</CommandEmpty>
            <CommandGroup heading="Brazzaville">
              {allDistricts
                .filter((d) => d.city === "Brazzaville")
                .map((district) => (
                  <CommandItem
                    key={`${district.city}-${district.district}`}
                    value={district.district}
                    onSelect={() => {
                      onSelect(district.district, district.city);
                      setOpen(false);
                    }}
                  >
                    {district.district}
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Pointe-Noire">
              {allDistricts
                .filter((d) => d.city === "Pointe-Noire")
                .map((district) => (
                  <CommandItem
                    key={`${district.city}-${district.district}`}
                    value={district.district}
                    onSelect={() => {
                      onSelect(district.district, district.city);
                      setOpen(false);
                    }}
                  >
                    {district.district}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
