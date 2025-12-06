import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChatMessageSkeleton } from "@/components/ui/skeleton-card";
import { ButtonLoader } from "@/components/ui/loading-spinner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface ChatInterfaceProps {
  orderId?: string;
  receiverId: string;
  receiverName: string;
}

export function ChatInterface({ orderId, receiverId, receiverName }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const query = supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${receiverId},receiver_id.eq.${receiverId}`)
        .order("created_at", { ascending: true });

      if (orderId) {
        query.eq("order_id", orderId);
      }

      const { data } = await query;
      if (data) {
        setMessages(data);
        // Count unread messages
        const unread = data.filter(
          (m) => m.receiver_id === user.id && !m.is_read
        ).length;
        setUnreadCount(unread);
      }
    } finally {
      setLoading(false);
    }
  }, [user, orderId, receiverId]);

  // Mark messages as read when opening chat
  const markMessagesAsRead = useCallback(async () => {
    if (!user) return;
    
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("sender_id", receiverId)
      .eq("is_read", false);
    
    setUnreadCount(0);
  }, [user, receiverId]);

  useEffect(() => {
    if (!user || !isOpen) return;

    fetchMessages();
    markMessagesAsRead();
    
    const channel = supabase
      .channel(`messages-${orderId || receiverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: orderId ? `order_id=eq.${orderId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            
            // Show notification for received messages
            if (newMsg.sender_id === receiverId) {
              toast({
                title: `Nouveau message de ${receiverName}`,
                description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? "..." : ""),
              });
              // Mark as read immediately if chat is open
              markMessagesAsRead();
            }
          } else {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId, receiverId, isOpen, fetchMessages, markMessagesAsRead, receiverName, toast]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        order_id: orderId,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing indicator would be sent here in a full implementation
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <MessageCircle className="h-4 w-4" />
          Chat
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Chat avec {receiverName}</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchMessages}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 mt-4 min-h-0">
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <ChatMessageSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucun message</p>
                <p className="text-xs">Commencez la conversation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground italic">
                        {receiverName} écrit...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Votre message..."
              onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
              disabled={sending}
            />
            <Button onClick={sendMessage} size="icon" disabled={sending || !newMessage.trim()}>
              {sending ? <ButtonLoader /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
