import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertType } from '@/services/alertService';
import { Bell, Package, AlertTriangle } from 'lucide-react';

interface UrgentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: AlertType;
}

export function UrgentAlertModal({ isOpen, onClose, title, message, type }: UrgentAlertModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'order_new':
        return <Package className="h-12 w-12 text-primary animate-bounce-soft" />;
      case 'admin_urgent':
        return <AlertTriangle className="h-12 w-12 text-destructive animate-pulse" />;
      default:
        return <Bell className="h-12 w-12 text-primary animate-bounce-soft" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'admin_urgent':
        return 'bg-destructive/10 border-destructive/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm rounded-3xl border-2">
        <AlertDialogHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full ${getBgClass()} flex items-center justify-center mb-4`}>
            {getIcon()}
          </div>
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction 
            onClick={onClose}
            className="rounded-full px-8 py-3 text-base font-semibold btn-playful w-full sm:w-auto"
          >
            Compris
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
