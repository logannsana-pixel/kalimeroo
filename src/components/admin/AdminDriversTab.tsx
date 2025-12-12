import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Truck, Search, CheckCircle, XCircle, Eye, 
  MoreHorizontal, FileText, Clock, Phone, MapPin, Car
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Driver {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  is_available: boolean;
  is_validated: boolean;
  validation_notes: string | null;
  vehicle_type: string | null;
  license_number: string | null;
  created_at: string;
}

export function AdminDriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationNotes, setValidationNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // First get driver user_ids
      const { data: driverRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "delivery_driver");

      if (rolesError) throw rolesError;

      if (!driverRoles || driverRoles.length === 0) {
        setDrivers([]);
        setLoading(false);
        return;
      }

      const driverIds = driverRoles.map(r => r.user_id);

      // Then get their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", driverIds)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setDrivers(profiles || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("Erreur lors du chargement des livreurs");
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (approved: boolean) => {
    if (!selectedDriver) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_validated: approved,
          is_available: approved,
          validation_notes: validationNotes || null,
          validated_at: new Date().toISOString(),
        })
        .eq("id", selectedDriver.id);

      if (error) throw error;

      toast.success(approved ? "Livreur validé" : "Livreur rejeté");
      setShowValidationModal(false);
      setSelectedDriver(null);
      setValidationNotes("");
      fetchDrivers();
    } catch (error) {
      console.error("Error updating driver:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAvailability = async (driver: Driver) => {
    if (!driver.is_validated) {
      toast.error("Le livreur doit d'abord être validé");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_available: !driver.is_available })
        .eq("id", driver.id);

      if (error) throw error;
      toast.success(driver.is_available ? "Livreur hors ligne" : "Livreur en ligne");
      fetchDrivers();
    } catch (error) {
      console.error("Error toggling driver:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = (d.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (d.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && !d.is_validated && d.is_available !== false;
    if (filter === 'validated') return matchesSearch && d.is_validated;
    if (filter === 'rejected') return matchesSearch && !d.is_validated && d.is_available === false;
    return matchesSearch;
  });

  const pendingCount = drivers.filter(d => !d.is_validated && d.is_available !== false).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{drivers.length}</p>
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
              {drivers.filter(d => d.is_validated).length}
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En ligne</p>
            <p className="text-2xl font-bold text-primary">
              {drivers.filter(d => d.is_validated && d.is_available).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livreur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'validated'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' && 'Tous'}
                  {f === 'pending' && 'En attente'}
                  {f === 'validated' && 'Validés'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun livreur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{driver.full_name || 'Sans nom'}</h3>
                        {driver.is_validated ? (
                          <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validé
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            <Clock className="w-3 h-3 mr-1" />
                            En attente
                          </Badge>
                        )}
                        {driver.is_validated && driver.is_available && (
                          <Badge className="bg-success/20 text-success border-success/30">
                            En ligne
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        {driver.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {driver.phone}
                          </span>
                        )}
                        {driver.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {driver.city}
                          </span>
                        )}
                        {driver.vehicle_type && (
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {driver.vehicle_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {driver.is_validated && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`avail-${driver.id}`} className="text-xs text-muted-foreground">
                          Disponible
                        </Label>
                        <Switch
                          id={`avail-${driver.id}`}
                          checked={driver.is_available || false}
                          onCheckedChange={() => toggleAvailability(driver)}
                        />
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedDriver(driver);
                          setValidationNotes(driver.validation_notes || "");
                          setShowValidationModal(true);
                        }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Valider/Rejeter
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir profil
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
            <DialogTitle>Validation du livreur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDriver && (
              <div className="p-4 rounded-xl bg-muted">
                <h3 className="font-semibold">{selectedDriver.full_name || 'Sans nom'}</h3>
                <p className="text-sm text-muted-foreground">{selectedDriver.phone}</p>
                {selectedDriver.vehicle_type && (
                  <p className="text-sm text-muted-foreground">Véhicule: {selectedDriver.vehicle_type}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes de validation</Label>
              <Textarea
                placeholder="Ajouter des notes (optionnel)..."
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleValidation(false)}
                disabled={actionLoading}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}