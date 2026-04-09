import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, CheckCheck, Package, Tag, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const TABS = [
  { label: "Tout", value: "all", icon: Bell },
  { label: "Commandes", value: "order_status", icon: Package },
  { label: "Promos", value: "promo", icon: Tag },
];

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  order_status: { icon: Package, color: "text-primary bg-primary/10" },
  promo: { icon: Tag, color: "text-accent bg-accent/10" },
  broadcast: { icon: Megaphone, color: "text-warning bg-warning/10" },
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);

  const filtered = tab === "all" ? notifications : notifications.filter(n => n.type === tab);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <SheetHeader className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-2">
            {TABS.map(t => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-2xs font-medium transition-all",
                  tab === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(n => {
                const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.order_status;
                const Icon = typeInfo.icon;
                return (
                  <button key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                    className={cn("w-full flex gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                      !n.is_read && "bg-primary/5"
                    )}>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", typeInfo.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{n.title}</p>
                      <p className="text-2xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-2xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
