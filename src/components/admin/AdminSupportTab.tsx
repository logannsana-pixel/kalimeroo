import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, Search, Clock, CheckCircle, AlertCircle,
  MoreHorizontal, User, Package, Send
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Ticket {
  id: string;
  user_id: string | null;
  order_id: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  user_name?: string;
}

interface TicketMessage {
  id: string;
  content: string;
  sender_id: string;
  is_internal: boolean;
  created_at: string;
}

const statusConfig = {
  open: { label: 'Ouvert', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-success/10 text-success border-success/30', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'text-muted-foreground' },
  medium: { label: 'Moyenne', color: 'text-blue-600' },
  high: { label: 'Haute', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-destructive' },
};

export function AdminSupportTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get user names
      const ticketsWithNames = await Promise.all((data || []).map(async (ticket) => {
        if (ticket.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", ticket.user_id)
            .single();
        return { ...ticket, user_name: profile?.full_name };
        }
        return ticket;
      }));

      setTickets(ticketsWithNames as Ticket[]);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Erreur lors du chargement des tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: newMessage.trim(),
          is_internal: false,
        });

      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedTicket.id);
      toast.success("Message envoyé");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
    setShowDetailModal(true);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer border-blue-500/30" onClick={() => setStatusFilter('open')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-yellow-500/30" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer border-success/30" onClick={() => setStatusFilter('resolved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold text-success">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Urgents</p>
                <p className="text-2xl font-bold text-destructive">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun ticket trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openTicketDetail(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{ticket.subject}</h3>
                          <Badge className={status.color}>{status.label}</Badge>
                          <span className={`text-xs font-medium ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {ticket.user_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.user_name}
                            </span>
                          )}
                          {ticket.order_id && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              #{ticket.order_id.slice(0, 8)}
                            </span>
                          )}
                          <span>{format(new Date(ticket.created_at), "d MMM HH:mm", { locale: fr })}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ticket.status === 'open' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            updateTicketStatus(ticket.id, 'in_progress');
                          }}>
                            Prendre en charge
                          </DropdownMenuItem>
                        )}
                        {ticket.status === 'in_progress' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            updateTicketStatus(ticket.id, 'resolved');
                          }}>
                            Marquer résolu
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          updateTicketStatus(ticket.id, 'closed');
                        }}>
                          Fermer le ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Ticket Info */}
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm">{selectedTicket.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <Badge className={statusConfig[selectedTicket.status].color}>
                    {statusConfig[selectedTicket.status].label}
                  </Badge>
                  <span>Priorité: {priorityConfig[selectedTicket.priority].label}</span>
                  <span>{format(new Date(selectedTicket.created_at), "d MMM yyyy HH:mm", { locale: fr })}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-xl ${
                      msg.is_internal 
                        ? 'bg-yellow-500/10 border border-yellow-500/30' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), "d MMM HH:mm", { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Votre réponse..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedTicket.status === 'open' && (
                  <Button onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'in_progress');
                    setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
                  }}>
                    Prendre en charge
                  </Button>
                )}
                {selectedTicket.status === 'in_progress' && (
                  <Button onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'resolved');
                    setShowDetailModal(false);
                  }}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer résolu
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}