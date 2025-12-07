import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, RefreshCw, X, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChatMessageSkeleton } from "@/components/ui/skeleton-card";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  order_id: string | null;
  created_at: string;
  is_read: boolean;
}

interface ChatInterfaceProps {
  orderId?: string;
  receiverId: string;
  receiverName: string;
  variant?: "button" | "inline" | "fullscreen";
  onClose?: () => void;
}

export function ChatInterface({ 
  orderId, 
  receiverId, 
  receiverName, 
  variant = "button",
  onClose 
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(variant !== "button");
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
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (orderId) {
        query.eq("order_id", orderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        setMessages(data);
        const unread = data.filter(
          (m) => m.receiver_id === user.id && !m.is_read
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [user, orderId, receiverId]);

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
      .channel(`messages-${orderId || `${user.id}-${receiverId}`}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's relevant to this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === receiverId) ||
            (newMsg.sender_id === receiverId && newMsg.receiver_id === user.id)
          ) {
            if (!orderId || newMsg.order_id === orderId) {
              setMessages((prev) => {
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              
              if (newMsg.sender_id === receiverId) {
                toast({
                  title: `Message de ${receiverName}`,
                  description: newMsg.content.substring(0, 50) + (newMsg.content.length > 50 ? "..." : ""),
                });
                markMessagesAsRead();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId, receiverId, isOpen, fetchMessages, markMessagesAsRead, receiverName, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        order_id: orderId || null,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Chat Content Component
  const ChatContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          {variant === "fullscreen" && (
            <Button variant="ghost" size="icon" onClick={handleClose} className="md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base">{receiverName}</h3>
            {orderId && (
              <p className="text-xs text-muted-foreground">
                Commande #{orderId.slice(-6)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchMessages}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {variant !== "inline" && (
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 md:p-4">
        {loading ? (
          <ChatMessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <MessageCircle className="h-10 w-10 md:h-12 md:w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun message</p>
            <p className="text-xs">Commencez la conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-2.5",
                    msg.sender_id === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={cn(
                    "text-[10px] md:text-xs mt-1",
                    msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
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
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
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

      {/* Input */}
      <div className="p-3 md:p-4 border-t bg-background shrink-0">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Votre message..."
            onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
            disabled={sending}
            className="flex-1 text-base md:text-sm"
          />
          <Button 
            onClick={sendMessage} 
            size="icon" 
            disabled={sending || !newMessage.trim()}
            className="shrink-0 h-10 w-10"
          >
            {sending ? <ButtonLoader /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // Button variant - shows a trigger button
  if (variant === "button") {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 relative"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* Fullscreen mobile modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-background md:bg-background/80 md:backdrop-blur-sm">
            <div className="h-full md:container md:mx-auto md:py-8 md:max-w-lg">
              <div className="h-full md:rounded-xl md:border md:shadow-xl bg-background flex flex-col overflow-hidden">
                <ChatContent />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline or Fullscreen variant
  return (
    <div className={cn(
      "flex flex-col bg-background",
      variant === "fullscreen" ? "fixed inset-0 z-50" : "h-full rounded-lg border"
    )}>
      <ChatContent />
    </div>
  );
}
