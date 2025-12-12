import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { soundService } from '@/services/soundService';
import { vibrationService } from '@/services/vibrationService';
import { pushService } from '@/services/pushService';
import { alertService } from '@/services/alertService';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, 
  Volume2, 
  Vibrate, 
  Smartphone,
  Check,
  X,
  Play,
  ChevronLeft,
  Shield,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function EnableAlerts() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundService.getEnabled());
  const [vibrationEnabled, setVibrationEnabled] = useState(vibrationService.getEnabled());
  const [pushEnabled, setPushEnabled] = useState(pushService.getEnabled());
  const [pushPermission, setPushPermission] = useState(pushService.getPermission());
  const [volume, setVolume] = useState([soundService.getVolume() * 100]);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Check PWA installation status
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (navigator as any).standalone === true || isStandalone;
      setIsPWAInstalled(isInstalled);
    };
    
    checkPWA();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleUnlockAudio = async () => {
    const unlocked = await soundService.unlock();
    setAudioUnlocked(unlocked);
    if (unlocked) {
      toast.success('Audio déverrouillé !');
      await soundService.testSound('success');
    } else {
      toast.error('Impossible de déverrouiller l\'audio');
    }
  };

  const handleRequestPushPermission = async () => {
    const permission = await pushService.requestPermission();
    setPushPermission(permission);
    if (permission === 'granted') {
      toast.success('Notifications activées !');
    } else if (permission === 'denied') {
      toast.error('Notifications refusées. Veuillez les activer dans les paramètres du navigateur.');
    }
  };

  const handleTestSound = async () => {
    await soundService.testSound('order_new_restaurant');
    toast.success('Son joué !');
  };

  const handleTestVibration = () => {
    const result = vibrationService.test();
    if (result) {
      toast.success('Vibration activée !');
    } else {
      toast.error('Vibration non supportée sur cet appareil');
    }
  };

  const handleTestPush = async () => {
    const result = await pushService.test();
    if (result) {
      toast.success('Notification envoyée !');
    } else {
      toast.error('Impossible d\'envoyer la notification');
    }
  };

  const handleTestAll = async () => {
    if (userRole) {
      await alertService.trigger({
        type: 'order_new',
        role: userRole as any,
        title: '🔔 Test d\'alerte complète',
        message: 'Ceci est un test de toutes les alertes',
      });
      toast.success('Test complet effectué !');
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPWAInstalled(true);
        toast.success('Application installée !');
      }
      setDeferredPrompt(null);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundService.setEnabled(enabled);
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    vibrationService.setEnabled(enabled);
  };

  const handlePushToggle = (enabled: boolean) => {
    setPushEnabled(enabled);
    pushService.setEnabled(enabled);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    soundService.setVolume(value[0] / 100);
  };

  const getStatusBadge = (enabled: boolean, label: string) => (
    <Badge 
      variant={enabled ? 'default' : 'secondary'} 
      className={`gap-1 ${enabled ? 'bg-success text-success-foreground' : ''}`}
    >
      {enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </Badge>
  );

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full shrink-0" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Alertes & Notifications</h1>
            <p className="text-sm text-muted-foreground">Configurez vos préférences</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1: Unlock Audio */}
          <Card className="rounded-3xl border-none shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
                Autoriser le son
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Autorisez l'application à jouer des sons pour les alertes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={handleUnlockAudio}
                  variant={audioUnlocked ? 'outline' : 'default'}
                  className="rounded-full gap-2 flex-1 min-w-[140px]"
                >
                  <Volume2 className="h-4 w-4" />
                  {audioUnlocked ? 'Déverrouillé' : 'Déverrouiller'}
                </Button>
                {getStatusBadge(audioUnlocked, audioUnlocked ? 'Activé' : 'Désactivé')}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Push Notifications */}
          <Card className="rounded-3xl border-none shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  2
                </div>
                Notifications push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recevez des notifications même quand l'app est fermée
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={handleRequestPushPermission}
                  variant={pushPermission === 'granted' ? 'outline' : 'default'}
                  disabled={pushPermission === 'denied'}
                  className="rounded-full gap-2 flex-1 min-w-[140px]"
                >
                  <Bell className="h-4 w-4" />
                  {pushPermission === 'granted' ? 'Autorisé' : pushPermission === 'denied' ? 'Refusé' : 'Autoriser'}
                </Button>
                {getStatusBadge(
                  pushPermission === 'granted', 
                  pushPermission === 'granted' ? 'Activé' : pushPermission === 'denied' ? 'Refusé' : 'En attente'
                )}
              </div>
              {pushPermission === 'denied' && (
                <p className="text-xs text-destructive">
                  Veuillez activer les notifications dans les paramètres de votre navigateur
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Install PWA */}
          <Card className="rounded-3xl border-none shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  3
                </div>
                Installer l'application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Installez l'app pour une meilleure expérience et des alertes en arrière-plan
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {deferredPrompt ? (
                  <Button 
                    onClick={handleInstallPWA}
                    className="rounded-full gap-2 flex-1 min-w-[140px]"
                  >
                    <Download className="h-4 w-4" />
                    Installer
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    disabled
                    className="rounded-full gap-2 flex-1 min-w-[140px]"
                  >
                    <Smartphone className="h-4 w-4" />
                    {isPWAInstalled ? 'Installée' : 'Via le menu du navigateur'}
                  </Button>
                )}
                {getStatusBadge(isPWAInstalled, isPWAInstalled ? 'Installée' : 'Non installée')}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="rounded-3xl border-none shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Sons</span>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>

              {/* Volume Slider */}
              {soundEnabled && (
                <div className="space-y-2 pl-8">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Volume</span>
                    <span>{Math.round(volume[0])}%</span>
                  </div>
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Vibrate className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Vibrations</span>
                </div>
                <Switch 
                  checked={vibrationEnabled} 
                  onCheckedChange={handleVibrationToggle}
                  disabled={!vibrationService.getSupported()}
                />
              </div>

              {/* Push Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Notifications</span>
                </div>
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={handlePushToggle}
                  disabled={pushPermission !== 'granted'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Section */}
          <Card className="rounded-3xl border-none shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Play className="h-5 w-5 text-primary" />
                Tester les alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleTestSound}
                  className="rounded-2xl h-12 gap-2"
                >
                  <Volume2 className="h-4 w-4" />
                  Son
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestVibration}
                  className="rounded-2xl h-12 gap-2"
                  disabled={!vibrationService.getSupported()}
                >
                  <Vibrate className="h-4 w-4" />
                  Vibration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestPush}
                  className="rounded-2xl h-12 gap-2"
                  disabled={pushPermission !== 'granted'}
                >
                  <Bell className="h-4 w-4" />
                  Notification
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleTestAll}
                  className="rounded-2xl h-12 gap-2"
                >
                  <Play className="h-4 w-4" />
                  Test complet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer className="hidden md:block" />
      <BottomNav />
    </div>
  );
}
