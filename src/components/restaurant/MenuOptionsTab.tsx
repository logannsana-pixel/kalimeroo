import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

interface MenuItem {
  id: string;
  name: string;
  category: string;
}

export function MenuOptionsTab({ restaurantId }: { restaurantId: string }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [optionGroups, setOptionGroups] = useState<MenuItemOptionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  useEffect(() => {
    if (selectedItemId) {
      fetchOptionGroups();
    }
  }, [selectedItemId]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category")
        .eq("restaurant_id", restaurantId)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Erreur lors du chargement des plats");
    }
  };

  const fetchOptionGroups = async () => {
    if (!selectedItemId) return;

    setLoading(true);
    try {
      const { data: groups, error: groupsError } = await supabase
        .from("menu_item_option_groups")
        .select("*")
        .eq("menu_item_id", selectedItemId)
        .order("display_order");

      if (groupsError) throw groupsError;

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        const { data: options, error: optionsError } = await supabase
          .from("menu_item_options")
          .select("*")
          .in("option_group_id", groupIds)
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
      console.error("Error fetching option groups:", error);
      toast.error("Erreur lors du chargement des options");
    } finally {
      setLoading(false);
    }
  };

  const addOptionGroup = async () => {
    if (!selectedItemId) {
      toast.error("Veuillez sélectionner un plat");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("menu_item_option_groups")
        .insert({
          menu_item_id: selectedItemId,
          name: "Nouveau groupe",
          description: "",
          is_required: false,
          min_selections: 0,
          max_selections: 1,
          display_order: optionGroups.length,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchOptionGroups();
      toast.success("Groupe ajouté");
    } catch (error) {
      console.error("Error adding option group:", error);
      toast.error("Erreur lors de l'ajout du groupe");
    }
  };

  const updateOptionGroup = async (groupId: string, updates: Partial<MenuItemOptionGroup>) => {
    try {
      const { error } = await supabase
        .from("menu_item_option_groups")
        .update(updates)
        .eq("id", groupId);

      if (error) throw error;
      await fetchOptionGroups();
    } catch (error) {
      console.error("Error updating option group:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteOptionGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("menu_item_option_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;
      await fetchOptionGroups();
      toast.success("Groupe supprimé");
    } catch (error) {
      console.error("Error deleting option group:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const addOption = async (groupId: string) => {
    try {
      const group = optionGroups.find(g => g.id === groupId);
      const { error } = await supabase
        .from("menu_item_options")
        .insert({
          option_group_id: groupId,
          name: "Nouvelle option",
          price_modifier: 0,
          is_available: true,
          display_order: group?.options.length || 0,
        });

      if (error) throw error;
      await fetchOptionGroups();
      toast.success("Option ajoutée");
    } catch (error) {
      console.error("Error adding option:", error);
      toast.error("Erreur lors de l'ajout de l'option");
    }
  };

  const updateOption = async (optionId: string, updates: Partial<MenuItemOption>) => {
    try {
      const { error } = await supabase
        .from("menu_item_options")
        .update(updates)
        .eq("id", optionId);

      if (error) throw error;
      await fetchOptionGroups();
    } catch (error) {
      console.error("Error updating option:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteOption = async (optionId: string) => {
    try {
      const { error } = await supabase
        .from("menu_item_options")
        .delete()
        .eq("id", optionId);

      if (error) throw error;
      await fetchOptionGroups();
      toast.success("Option supprimée");
    } catch (error) {
      console.error("Error deleting option:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const selectedItem = menuItems.find(item => item.id === selectedItemId);

  return (
    <div className="space-y-4 sm:space-y-6 pb-safe">
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Options et Accompagnements</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configurez les options, accompagnements et boissons pour vos plats (comme UberEats)
        </p>
      </div>

      <div>
        <Label htmlFor="menu-item-select" className="text-sm sm:text-base">Sélectionner un plat</Label>
        <select
          id="menu-item-select"
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full mt-2 px-3 py-2 border rounded-md bg-background text-sm sm:text-base"
        >
          <option value="">-- Choisir un plat --</option>
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.category} - {item.name}
            </option>
          ))}
        </select>
      </div>

      {selectedItemId && (
        <>
          <div className="flex justify-between items-center">
            <h4 className="text-base sm:text-lg font-semibold">
              Groupes d'options pour: {selectedItem?.name}
            </h4>
            <Button onClick={addOptionGroup} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un groupe
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : optionGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                Aucun groupe d'options. Cliquez sur "Ajouter un groupe" pour commencer.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {optionGroups.map((group) => (
                <Collapsible
                  key={group.id}
                  open={openGroups[group.id] !== false}
                  onOpenChange={(open) => setOpenGroups({ ...openGroups, [group.id]: open })}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={group.name}
                            onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                            placeholder="Nom du groupe (ex: Accompagnements)"
                            className="font-semibold text-sm sm:text-base"
                          />
                          <Textarea
                            value={group.description || ""}
                            onChange={(e) => updateOptionGroup(group.id, { description: e.target.value })}
                            placeholder="Description (optionnel)"
                            rows={2}
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {openGroups[group.id] !== false ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOptionGroup(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs sm:text-sm">Requis</Label>
                          <Switch
                            checked={group.is_required}
                            onCheckedChange={(checked) => updateOptionGroup(group.id, { is_required: checked })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Min sélections</Label>
                          <Input
                            type="number"
                            min="0"
                            value={group.min_selections}
                            onChange={(e) => updateOptionGroup(group.id, { min_selections: parseInt(e.target.value) || 0 })}
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Max sélections</Label>
                          <Input
                            type="number"
                            min="1"
                            value={group.max_selections}
                            onChange={(e) => updateOptionGroup(group.id, { max_selections: parseInt(e.target.value) || 1 })}
                            className="text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-sm font-semibold">Options</Label>
                          <Button
                            onClick={() => addOption(group.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Option
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {group.options.map((option) => (
                            <div
                              key={option.id}
                              className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <Input
                                value={option.name}
                                onChange={(e) => updateOption(option.id, { name: e.target.value })}
                                placeholder="Nom de l'option"
                                className="flex-1 text-xs sm:text-sm"
                              />
                              <Input
                                type="number"
                                value={option.price_modifier}
                                onChange={(e) => updateOption(option.id, { price_modifier: parseFloat(e.target.value) || 0 })}
                                placeholder="Prix"
                                className="w-20 sm:w-24 text-xs sm:text-sm"
                              />
                              <span className="text-xs whitespace-nowrap">FCFA</span>
                              <Switch
                                checked={option.is_available}
                                onCheckedChange={(checked) => updateOption(option.id, { is_available: checked })}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteOption(option.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}

                          {group.options.length === 0 && (
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                              Aucune option. Cliquez sur "+ Option" pour en ajouter.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
