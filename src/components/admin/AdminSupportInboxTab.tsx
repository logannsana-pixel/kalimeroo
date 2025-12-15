import { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, CheckCircle, AlertCircle, User, Store, Truck, Users, Send, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface Ticket {
  id: string;
  user_id: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  user_type: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Ouvert', color: 'bg-blue-500/20 text-blue-500', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Moyenne', color: 'bg-yellow-500/20 text-yellow-500' },
  high: { label: 'Haute', color: 'bg-orange-500/20 text-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500/20 text-red-500' },
};

const userTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  customer: { label: 'Clients', icon: User },
  restaurant_owner: { label: 'Restaurants', icon: Store },
  delivery_driver: { label: 'Livreurs', icon: Truck },
  visitor: { label: 'Visiteurs', icon: Users },
};

const AdminSupportInboxTab = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeUserType, setActiveUserType] = useState('customer');

  useEffect(() => {
    fetchTickets();

    // Realtime subscription
    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names for tickets with user_id
      const ticketsWithNames = await Promise.all(
        (data || []).map(async (ticket) => {
          if (ticket.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', ticket.user_id)
              .single();
            return { ...ticket, user_name: profile?.full_name || 'Utilisateur' };
          }
          return { ...ticket, user_name: 'Visiteur' };
        })
      );

      setTickets(ticketsWithNames);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await fetchMessages(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: newMessage.trim(),
          is_internal: false,
        });

      if (error) throw error;

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
      }

      setNewMessage('');
      await fetchMessages(selectedTicket.id);
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success('Statut mis à jour');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getFilteredTickets = (userType: string) => {
    return tickets.filter(ticket => {
      const matchesUserType = ticket.user_type === userType;
      const matchesSearch = searchQuery
        ? ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      return matchesUserType && matchesSearch && matchesStatus;
    });
  };

  const getUnreadCount = (userType: string) => {
    return tickets.filter(t => t.user_type === userType && t.status === 'open').length;
  };

  const renderTicketList = (userType: string) => {
    const filteredTickets = getFilteredTickets(userType);

    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      );
    }

    if (filteredTickets.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun ticket</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredTickets.map(ticket => {
          const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle;
          return (
            <button
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedTicket?.id === ticket.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {ticket.user_name} • {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={`text-[10px] px-1.5 py-0 ${priorityConfig[ticket.priority]?.color}`}>
                    {priorityConfig[ticket.priority]?.label}
                  </Badge>
                  <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig[ticket.status]?.color}`}>
                    <StatusIcon className="w-3 h-3 mr-0.5" />
                    {statusConfig[ticket.status]?.label}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {ticket.description}
              </p>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inbox Support</h2>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Type Tabs */}
      <Tabs value={activeUserType} onValueChange={setActiveUserType}>
        <TabsList className="grid grid-cols-4 h-10">
          {Object.entries(userTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            const unread = getUnreadCount(type);
            return (
              <TabsTrigger key={type} value={type} className="relative text-xs gap-1">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{config.label}</span>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(userTypeConfig).map(type => (
          <TabsContent key={type} value={type} className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {renderTicketList(type)}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Ticket Info */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={priorityConfig[selectedTicket.priority]?.color}>
                  {priorityConfig[selectedTicket.priority]?.label}
                </Badge>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(val) => handleUpdateStatus(selectedTicket.id, val)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedTicket.user_name}
                </span>
              </div>

              {/* Original Message */}
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">Message original :</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 mb-3">
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg text-sm ${
                        msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Répondre..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  size="icon"
                  className="h-[60px] w-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportInboxTab;
