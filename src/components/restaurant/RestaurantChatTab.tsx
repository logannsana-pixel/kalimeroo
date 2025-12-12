import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInterface } from "@/components/ChatInterface";
import { MessageCircle, User, Truck, Loader2 } from "lucide-react";

interface Conversation {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  driverId: string | null;
  driverName: string | null;
  lastMessage: string;
  unreadCount: number;
  createdAt: string;
}

export const RestaurantChatTab = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [chatType, setChatType] = useState<'customer' | 'driver'>('customer');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      // Get active orders with conversations
      const { data: orders } = await supabase
        .from('orders')
        .select('id, user_id, delivery_driver_id, created_at')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['pending', 'accepted', 'preparing', 'pickup_pending', 'pickup_accepted', 'picked_up', 'delivering'])
        .order('created_at', { ascending: false });

      if (!orders || orders.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get customer and driver profiles
      const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
      const driverIds = [...new Set(orders.map(o => o.delivery_driver_id).filter(Boolean))] as string[];

      const [{ data: profiles }, { data: driverProfiles }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', userIds),
        driverIds.length > 0 
          ? supabase.from('profiles').select('id, full_name').in('id', driverIds)
          : { data: [] }
      ]);

      const profilesMap = new Map<string, string | null>(
        profiles?.map(p => [p.id, p.full_name] as [string, string | null]) || []
      );
      const driversMap = new Map<string, string | null>(
        driverProfiles?.map(p => [p.id, p.full_name] as [string, string | null]) || []
      );

      const convs: Conversation[] = orders.map(order => ({
        orderId: order.id,
        orderNumber: order.id.slice(0, 8).toUpperCase(),
        customerId: order.user_id,
        customerName: profilesMap.get(order.user_id) || 'Client',
        driverId: order.delivery_driver_id,
        driverName: order.delivery_driver_id ? (driversMap.get(order.delivery_driver_id) || 'Livreur') : null,
        lastMessage: '',
        unreadCount: 0,
        createdAt: order.created_at
      }));

      setConversations(convs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Messages</h2>
        <Badge variant="secondary">{conversations.length} conversations actives</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversations list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 px-4">
                  Aucune conversation active
                </p>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <div
                      key={conv.orderId}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.orderId === conv.orderId ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">#{conv.orderNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{conv.customerName}</span>
                      </div>
                      {conv.driverName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Truck className="h-3 w-3" />
                          <span>{conv.driverName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? (
                <div className="flex items-center justify-between">
                  <span>Commande #{selectedConversation.orderNumber}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={chatType === 'customer' ? 'default' : 'outline'}
                      onClick={() => setChatType('customer')}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Client
                    </Button>
                    {selectedConversation.driverId && (
                      <Button
                        size="sm"
                        variant={chatType === 'driver' ? 'default' : 'outline'}
                        onClick={() => setChatType('driver')}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Livreur
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                'Sélectionnez une conversation'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="h-[400px]">
                <ChatInterface
                  orderId={selectedConversation.orderId}
                  receiverId={chatType === 'customer' ? selectedConversation.customerId : selectedConversation.driverId!}
                  receiverName={chatType === 'customer' ? selectedConversation.customerName : selectedConversation.driverName!}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
