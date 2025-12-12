import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { alertService, UserRole, AlertType } from '@/services/alertService';
import { soundService, SoundType } from '@/services/soundService';
import { vibrationService, VibrationPattern } from '@/services/vibrationService';
import { pushService } from '@/services/pushService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Volume2, 
  Vibrate, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ShoppingBag,
  MessageCircle,
  Truck,
  Settings
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const ALERT_TYPES: { type: AlertType; label: string; icon: React.ReactNode }[] = [
  { type: 'order_new', label: 'Nouvelle commande', icon: <ShoppingBag className="h-4 w-4" /> },
  { type: 'order_accepted', label: 'Commande acceptée', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'order_preparing', label: 'Commande en préparation', icon: <Settings className="h-4 w-4" /> },
  { type: 'order_ready', label: 'Commande prête', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'order_picked_up', label: 'Commande récupérée', icon: <Truck className="h-4 w-4" /> },
  { type: 'order_delivered', label: 'Commande livrée', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'order_cancelled', label: 'Commande annulée', icon: <XCircle className="h-4 w-4" /> },
  { type: 'delivery_available', label: 'Livraison disponible', icon: <Truck className="h-4 w-4" /> },
  { type: 'message_received', label: 'Nouveau message', icon: <MessageCircle className="h-4 w-4" /> },
  { type: 'admin_urgent', label: 'Alerte urgente', icon: <AlertTriangle className="h-4 w-4" /> },
  { type: 'success', label: 'Succès', icon: <CheckCircle className="h-4 w-4" /> },
  { type: 'error', label: 'Erreur', icon: <XCircle className="h-4 w-4" /> },
];

const SOUND_TYPES: SoundType[] = [
  'order_new_restaurant',
  'order_new_driver',
  'order_new_customer',
  'message_received',
  'order_status_update',
  'admin_alert',
  'success',
  'error',
];

const VIBRATION_PATTERNS: VibrationPattern[] = [
  'order_new_restaurant',
  'order_new_driver',
  'notification',
  'success',
  'error',
  'urgent',
];

const ROLES: { role: UserRole; label: string }[] = [
  { role: 'customer', label: 'Client' },
  { role: 'restaurant_owner', label: 'Restaurateur' },
  { role: 'delivery_driver', label: 'Livreur' },
  { role: 'admin', label: 'Admin' },
];

export default function AlertPlayground() {
  const { userRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>((userRole as UserRole) || 'customer');
  const [loading, setLoading] = useState<string | null>(null);

  const handleTestAlert = async (type: AlertType) => {
    setLoading(type);
    await alertService.trigger({
      type,
      role: selectedRole,
      title: `Test: ${ALERT_TYPES.find(a => a.type === type)?.label}`,
      message: 'Ceci est un test de notification',
      data: { orderId: 'test-123' },
    });
    setLoading(null);
  };

  const handleTestSound = (type: SoundType) => {
    soundService.testSound(type);
  };

  const handleTestVibration = (pattern: VibrationPattern) => {
    vibrationService.vibrate(pattern);
  };

  const handleTestPush = async () => {
    await pushService.show({
      title: 'Test Push Notification',
      body: 'Les notifications push fonctionnent correctement ! 🎉',
      tag: 'test-push',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🧪 Alert Playground</h1>
            <p className="text-muted-foreground">
              Testez tous les types d'alertes, sons et vibrations
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Mode Dev
          </Badge>
        </div>

        {/* Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Tester en tant que:</span>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(({ role, label }) => (
                    <SelectItem key={role} value={role}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alert Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Types d'alertes
            </CardTitle>
            <CardDescription>
              Testez chaque type d'alerte avec son son, vibration et notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ALERT_TYPES.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-3 px-4 flex flex-col items-center gap-2"
                  onClick={() => handleTestAlert(type)}
                  disabled={loading === type}
                >
                  {icon}
                  <span className="text-xs text-center">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sounds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sons
              </CardTitle>
              <CardDescription>
                Testez chaque type de son individuellement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {SOUND_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTestSound(type)}
                  >
                    🔊 {type}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vibrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vibrate className="h-5 w-5" />
                Vibrations
              </CardTitle>
              <CardDescription>
                Testez chaque pattern de vibration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {VIBRATION_PATTERNS.map((pattern) => (
                  <Button
                    key={pattern}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleTestVibration(pattern)}
                  >
                    📳 {pattern}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Testez les notifications push du navigateur
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Button onClick={handleTestPush}>
              Envoyer une notification push
            </Button>
            <Badge variant={pushService.getPermission() === 'granted' ? 'default' : 'secondary'}>
              Permission: {pushService.getPermission()}
            </Badge>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-xl text-center">
                <div className="text-2xl mb-1">
                  {soundService.getEnabled() ? '✅' : '❌'}
                </div>
                <div className="text-sm font-medium">Sons</div>
                <div className="text-xs text-muted-foreground">
                  {soundService.getEnabled() ? 'Activés' : 'Désactivés'}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-xl text-center">
                <div className="text-2xl mb-1">
                  {vibrationService.getEnabled() ? '✅' : '❌'}
                </div>
                <div className="text-sm font-medium">Vibrations</div>
                <div className="text-xs text-muted-foreground">
                  {vibrationService.getSupported() ? 'Supporté' : 'Non supporté'}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-xl text-center">
                <div className="text-2xl mb-1">
                  {pushService.getPermission() === 'granted' ? '✅' : '⚠️'}
                </div>
                <div className="text-sm font-medium">Push</div>
                <div className="text-xs text-muted-foreground">
                  {pushService.getPermission()}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-xl text-center">
                <div className="text-2xl mb-1">
                  {navigator.onLine ? '✅' : '❌'}
                </div>
                <div className="text-sm font-medium">Réseau</div>
                <div className="text-xs text-muted-foreground">
                  {navigator.onLine ? 'En ligne' : 'Hors ligne'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
