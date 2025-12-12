import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, Search, MoreHorizontal, Phone, MapPin, 
  ShoppingBag, User, Store, Truck, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserWithRole {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  created_at: string;
  role: string;
  orders_count?: number;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  customer: { label: 'Client', icon: User, color: 'bg-blue-500/10 text-blue-600' },
  restaurant_owner: { label: 'Restaurateur', icon: Store, color: 'bg-orange-500/10 text-orange-600' },
  delivery_driver: { label: 'Livreur', icon: Truck, color: 'bg-green-500/10 text-green-600' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-500/10 text-purple-600' },
};

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch order counts per user
      const { data: orderCounts, error: ordersError } = await supabase
        .from("orders")
        .select("user_id");

      if (ordersError) throw ordersError;

      // Create role map
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      // Create order count map
      const orderCountMap = new Map<string, number>();
      orderCounts?.forEach(o => {
        orderCountMap.set(o.user_id, (orderCountMap.get(o.user_id) || 0) + 1);
      });

      // Combine data
      const usersWithRoles = profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.id) || 'customer',
        orders_count: orderCountMap.get(p.id) || 0,
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  const stats = {
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    restaurants: users.filter(u => u.role === 'restaurant_owner').length,
    drivers: users.filter(u => u.role === 'delivery_driver').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer" onClick={() => setRoleFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setRoleFilter('customer')}>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="text-xl font-bold">{stats.customers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setRoleFilter('restaurant_owner')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Restaurateurs</p>
              <p className="text-xl font-bold">{stats.restaurants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setRoleFilter('delivery_driver')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Livreurs</p>
              <p className="text-xl font-bold">{stats.drivers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setRoleFilter('admin')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-xl font-bold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'customer', 'restaurant_owner', 'delivery_driver', 'admin'].map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role === 'all' ? 'Tous' : roleConfig[role]?.label || role}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const roleInfo = roleConfig[user.role] || roleConfig.customer;
            const RoleIcon = roleInfo.icon;
            
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full ${roleInfo.color} flex items-center justify-center shrink-0`}>
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{user.full_name || 'Sans nom'}</h3>
                          <Badge variant="outline" className={roleInfo.color}>
                            {roleInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </span>
                          )}
                          {user.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.city}
                            </span>
                          )}
                          {user.role === 'customer' && (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              {user.orders_count} commandes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(new Date(user.created_at), "d MMM yyyy", { locale: fr })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir profil</DropdownMenuItem>
                          <DropdownMenuItem>Voir commandes</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Suspendre</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}