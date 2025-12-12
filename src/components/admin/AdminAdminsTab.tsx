import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, Plus, Search, MoreHorizontal, User, 
  Store, Truck, Package, CreditCard, Settings,
  Megaphone, MessageSquare, Users
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

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  can_manage_restaurants: boolean;
  can_manage_drivers: boolean;
  can_manage_orders: boolean;
  can_manage_users: boolean;
  can_manage_payments: boolean;
  can_manage_settings: boolean;
  can_manage_marketing: boolean;
  can_manage_support: boolean;
  can_manage_admins: boolean;
  created_at: string;
}

const permissionsList = [
  { key: 'can_manage_restaurants', label: 'Restaurants', icon: Store },
  { key: 'can_manage_drivers', label: 'Livreurs', icon: Truck },
  { key: 'can_manage_orders', label: 'Commandes', icon: Package },
  { key: 'can_manage_users', label: 'Utilisateurs', icon: Users },
  { key: 'can_manage_payments', label: 'Paiements', icon: CreditCard },
  { key: 'can_manage_settings', label: 'Paramètres', icon: Settings },
  { key: 'can_manage_marketing', label: 'Marketing', icon: Megaphone },
  { key: 'can_manage_support', label: 'Support', icon: MessageSquare },
  { key: 'can_manage_admins', label: 'Admins', icon: Shield },
];

export function AdminAdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get admin users
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        setLoading(false);
        return;
      }

      const adminIds = adminRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .in("id", adminIds);

      if (profilesError) throw profilesError;

      // Get permissions
      const { data: permissionsData, error: permError } = await supabase
        .from("admin_permissions")
        .select("*")
        .in("user_id", adminIds);

      if (permError) throw permError;

      const permissionsMap = new Map(permissionsData?.map(p => [p.user_id, p]) || []);

      const adminsWithPermissions = profiles?.map(p => {
        const perm = permissionsMap.get(p.id);
        return {
          id: perm?.id || p.id,
          user_id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          created_at: p.created_at,
          can_manage_restaurants: perm?.can_manage_restaurants ?? true,
          can_manage_drivers: perm?.can_manage_drivers ?? true,
          can_manage_orders: perm?.can_manage_orders ?? true,
          can_manage_users: perm?.can_manage_users ?? true,
          can_manage_payments: perm?.can_manage_payments ?? true,
          can_manage_settings: perm?.can_manage_settings ?? true,
          can_manage_marketing: perm?.can_manage_marketing ?? true,
          can_manage_support: perm?.can_manage_support ?? true,
          can_manage_admins: perm?.can_manage_admins ?? false,
        };
      }) || [];

      setAdmins(adminsWithPermissions);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Erreur lors du chargement des admins");
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setPermissions({
      can_manage_restaurants: admin.can_manage_restaurants,
      can_manage_drivers: admin.can_manage_drivers,
      can_manage_orders: admin.can_manage_orders,
      can_manage_users: admin.can_manage_users,
      can_manage_payments: admin.can_manage_payments,
      can_manage_settings: admin.can_manage_settings,
      can_manage_marketing: admin.can_manage_marketing,
      can_manage_support: admin.can_manage_support,
      can_manage_admins: admin.can_manage_admins,
    });
    setShowPermissionsModal(true);
  };

  const savePermissions = async () => {
    if (!selectedAdmin) return;

    try {
      // Check if permissions record exists
      const { data: existing } = await supabase
        .from("admin_permissions")
        .select("id")
        .eq("user_id", selectedAdmin.user_id)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("admin_permissions")
          .update(permissions)
          .eq("user_id", selectedAdmin.user_id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("admin_permissions")
          .insert({
            user_id: selectedAdmin.user_id,
            ...permissions,
          });

        if (error) throw error;
      }

      toast.success("Permissions mises à jour");
      setShowPermissionsModal(false);
      fetchAdmins();
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const filteredAdmins = admins.filter((a) => 
    (a.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (a.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const countPermissions = (admin: AdminUser) => {
    return permissionsList.filter(p => admin[p.key as keyof AdminUser]).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Équipe Admin</h2>
          <p className="text-muted-foreground">Gérez les administrateurs et leurs permissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold">
                  {admins.filter(a => a.can_manage_admins).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accès limité</p>
                <p className="text-2xl font-bold">
                  {admins.filter(a => countPermissions(a) < 9).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun administrateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredAdmins.map((admin) => (
            <Card key={admin.user_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{admin.full_name || 'Admin'}</h3>
                        {admin.can_manage_admins && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {countPermissions(admin)}/{permissionsList.length} permissions
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Depuis {format(new Date(admin.created_at), "MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openPermissionsModal(admin)}
                    >
                      Permissions
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPermissionsModal(admin)}>
                          Modifier les permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Révoquer l'accès admin
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

      {/* Permissions Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissions de {selectedAdmin?.full_name || 'Admin'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {permissionsList.map((perm) => {
                const Icon = perm.icon;
                return (
                  <div 
                    key={perm.key} 
                    className="flex items-center justify-between p-3 rounded-xl border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span>{perm.label}</span>
                    </div>
                    <Switch
                      checked={permissions[perm.key] || false}
                      onCheckedChange={(checked) => 
                        setPermissions({ ...permissions, [perm.key]: checked })
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  const allTrue = Object.fromEntries(
                    permissionsList.map(p => [p.key, true])
                  );
                  setPermissions(allTrue);
                }}
              >
                Tout activer
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  const allFalse = Object.fromEntries(
                    permissionsList.map(p => [p.key, false])
                  );
                  setPermissions(allFalse);
                }}
              >
                Tout désactiver
              </Button>
            </div>

            <Button className="w-full" onClick={savePermissions}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}