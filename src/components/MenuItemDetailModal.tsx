import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Minus, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

interface MenuItemOption {
  id: string;
  option_group_id: string;
  name: string;
  price_modifier: number;
  is_available: boolean;
  display_order: number;
}

interface MenuItemOptionGroup {
  id: string;
  menu_item_id: string;
  name: string;
  description: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  display_order: number;
  options: MenuItemOption[];
}

interface MenuItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (itemId: string, quantity: number, selectedOptions: any[]) => Promise<void>;
}

export function MenuItemDetailModal({ item, isOpen, onClose, onAddToCart }: MenuItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [optionGroups, setOptionGroups] = useState<MenuItemOptionGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      fetchOptionGroups();
      setQuantity(1);
      setSelectedOptions({});
    }
  }, [item, isOpen]);

  const fetchOptionGroups = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      const { data: groups, error: groupsError } = await supabase
        .from("menu_item_option_groups")
        .select("*")
        .eq("menu_item_id", item.id)
        .order("display_order");

      if (groupsError) throw groupsError;

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        const { data: options, error: optionsError } = await supabase
          .from("menu_item_options")
          .select("*")
          .in("option_group_id", groupIds)
          .eq("is_available", true)
          .order("display_order");

        if (optionsError) throw optionsError;

        const groupedData = groups.map(group => ({
          ...group,
          options: options?.filter(opt => opt.option_group_id === group.id) || []
        }));

        setOptionGroups(groupedData);
      } else {
        setOptionGroups([]);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Erreur lors du chargement des options");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (groupId: string, optionId: string, isMultiple: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      
      if (isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) };
        } else {
          const group = optionGroups.find(g => g.id === groupId);
          if (group && current.length < group.max_selections) {
            return { ...prev, [groupId]: [...current, optionId] };
          }
          return prev;
        }
      } else {
        return { ...prev, [groupId]: [optionId] };
      }
    });
  };

  const isValidSelection = () => {
    return optionGroups.every(group => {
      const selections = selectedOptions[group.id] || [];
      return selections.length >= group.min_selections && 
             selections.length <= group.max_selections;
    });
  };

  const calculateTotalPrice = () => {
    let total = item?.price || 0;
    
    optionGroups.forEach(group => {
      const selections = selectedOptions[group.id] || [];
      selections.forEach(optionId => {
        const option = group.options.find(opt => opt.id === optionId);
        if (option) {
          total += Number(option.price_modifier);
        }
      });
    });

    return total * quantity;
  };

  const handleAddToCart = async () => {
    if (!item) return;
    if (!isValidSelection()) {
      toast.error("Veuillez sélectionner toutes les options requises");
      return;
    }

    setSubmitting(true);
    try {
      const formattedOptions = optionGroups.flatMap(group => {
        const selections = selectedOptions[group.id] || [];
        return selections.map(optionId => {
          const option = group.options.find(opt => opt.id === optionId);
          return {
            option_id: optionId,
            option_name: option?.name || "",
            option_group_name: group.name,
            price_modifier: Number(option?.price_modifier || 0)
          };
        });
      });

      await onAddToCart(item.id, quantity, formattedOptions);
      onClose();
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 backdrop-blur p-2 hover:bg-background"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        {item.image_url && (
          <div className="relative h-48 sm:h-64 md:h-80 w-full">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl sm:text-3xl">{item.name}</DialogTitle>
            <p className="text-muted-foreground text-sm sm:text-base mt-2">{item.description}</p>
            <p className="text-xl sm:text-2xl font-bold mt-3">{Number(item.price).toFixed(0)} FCFA</p>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {optionGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      {group.name}
                      {group.is_required && <span className="text-destructive ml-1">*</span>}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.max_selections === 1 
                        ? "Choisissez-en 1"
                        : `Choisissez jusqu'à ${group.max_selections}`}
                    </p>
                  </div>

                  {group.max_selections === 1 ? (
                    <RadioGroup
                      value={selectedOptions[group.id]?.[0] || ""}
                      onValueChange={(value) => handleOptionChange(group.id, value, false)}
                    >
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent">
                          <div className="flex items-center space-x-3 flex-1">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer text-sm sm:text-base">
                              {option.name}
                            </Label>
                          </div>
                          {option.price_modifier > 0 && (
                            <span className="text-sm font-medium ml-2">
                              +{Number(option.price_modifier).toFixed(0)} FCFA
                            </span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {group.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent">
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              id={option.id}
                              checked={(selectedOptions[group.id] || []).includes(option.id)}
                              onCheckedChange={() => handleOptionChange(group.id, option.id, true)}
                            />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer text-sm sm:text-base">
                              {option.name}
                            </Label>
                          </div>
                          {option.price_modifier > 0 && (
                            <span className="text-sm font-medium ml-2">
                              +{Number(option.price_modifier).toFixed(0)} FCFA
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base sm:text-lg">Quantité</span>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base sm:text-lg"
              onClick={handleAddToCart}
              disabled={!isValidSelection() || submitting}
            >
              Ajouter au panier - {calculateTotalPrice().toFixed(0)} FCFA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
