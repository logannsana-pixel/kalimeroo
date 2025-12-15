import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Store, Search, CheckCircle, XCircle, Eye, Edit, 
  MoreHorizontal, FileText, Clock, MapPin, Phone, Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RestaurantDetailModal } from "./RestaurantDetailModal";
import { PaymentSettingsModal } from "./PaymentSettingsModal";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  cuisine_type: string | null;
  is_active: boolean;
  is_validated: boolean;
  validation_notes: string | null;
  created_at: string;
  owner_id: string | null;
  image_url: string | null;
}

export function AdminRestaurantsTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Erreur lors du chargement des restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (approved: boolean) => {
    if (!selectedRestaurant) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          is_validated: approved,
          is_active: approved,
          validation_notes: validationNotes || null,
          validated_at: new Date().toISOString(),
        })
        .eq("id", selectedRestaurant.id);

      if (error) throw error;

      toast.success(approved ? "Restaurant validé" : "Restaurant rejeté");
      setShowValidationModal(false);
      setSelectedRestaurant(null);
      setValidationNotes("");
      fetchRestaurants();
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (restaurant: Restaurant) => {
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: !restaurant.is_active })
        .eq("id", restaurant.id);

      if (error) throw error;
      toast.success(restaurant.is_active ? "Restaurant désactivé" : "Restaurant activé");
      fetchRestaurants();
    } catch (error) {
      console.error("Error toggling restaurant:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && !r.is_validated && r.is_active;
    if (filter === 'validated') return matchesSearch && r.is_validated;
    if (filter === 'rejected') return matchesSearch && !r.is_validated && !r.is_active;
    return matchesSearch;
  });

  const pendingCount = restaurants.filter(r => !r.is_validated && r.is_active !== false).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{restaurants.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-warning/50" onClick={() => setFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-success/50" onClick={() => setFilter('validated')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Validés</p>
            <p className="text-2xl font-bold text-success">
              {restaurants.filter(r => r.is_validated).length}
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-destructive/50" onClick={() => setFilter('rejected')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejetés</p>
            <p className="text-2xl font-bold text-destructive">
              {restaurants.filter(r => !r.is_validated && !r.is_active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'validated', 'rejected'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' && 'Tous'}
                  {f === 'pending' && 'En attente'}
                  {f === 'validated' && 'Validés'}
                  {f === 'rejected' && 'Rejetés'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun restaurant trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {restaurant.image_url ? (
                        <img 
                          src={restaurant.image_url} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{restaurant.name}</h3>
                        {restaurant.is_validated ? (
                          <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validé
                          </Badge>
                        ) : restaurant.is_active === false ? (
                          <Badge variant="destructive">Rejeté</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            <Clock className="w-3 h-3 mr-1" />
                            En attente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {restaurant.address}
                        </span>
                        {restaurant.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {restaurant.phone}
                          </span>
                        )}
                      </div>
                      {restaurant.cuisine_type && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {restaurant.cuisine_type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${restaurant.id}`} className="text-xs text-muted-foreground">
                        Actif
                      </Label>
                      <Switch
                        id={`active-${restaurant.id}`}
                        checked={restaurant.is_active}
                        onCheckedChange={() => toggleActive(restaurant)}
                        disabled={!restaurant.is_validated}
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setValidationNotes(restaurant.validation_notes || "");
                          setShowValidationModal(true);
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Valider/Rejeter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setShowDetailModal(true);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setShowPaymentModal(true);
                        }}>
                          <Settings className="w-4 h-4 mr-2" />
                          Config. paiement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Validation Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validation du restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRestaurant && (
              <div className="p-4 rounded-xl bg-muted">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {selectedRestaurant.image_url ? (
                      <img 
                        src={selectedRestaurant.image_url} 
                        alt={selectedRestaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={selectedRestaurant.is_validated ? "default" : "secondary"}>
                    {selectedRestaurant.is_validated ? "Validé" : "En attente"}
                  </Badge>
                  {selectedRestaurant.cuisine_type && (
                    <Badge variant="outline">{selectedRestaurant.cuisine_type}</Badge>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message pour le restaurateur</Label>
              <Textarea
                placeholder="En cas de rejet, expliquez ce qui doit être corrigé (documents manquants, informations incomplètes, etc.)..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Ce message sera visible par le restaurateur dans son tableau de bord
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleValidation(false)}
                disabled={actionLoading || !validationNotes.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleValidation(true)}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </div>
            
            {!validationNotes.trim() && (
              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Un message est requis pour rejeter
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RestaurantDetailModal
        restaurantId={selectedRestaurant?.id || null}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRestaurant(null);
        }}
        onUpdate={fetchRestaurants}
      />

      <PaymentSettingsModal
        entityId={selectedRestaurant?.owner_id || null}
        entityType="restaurant"
        entityName={selectedRestaurant?.name || ""}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedRestaurant(null);
        }}
      />
    </div>
  );
}