
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TicketMessage } from "@/types/dashboard";

export const useMessaging = (onMessageSent?: () => void) => {
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [conversations, setConversations] = useState<TicketMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }
      
      setConversations(data || []);
      
      // Count unread messages
      const unread = (data || []).filter(msg => !msg.read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const sendMessage = async ({
    recipientId,
    subject,
    message,
    ticketId
  }: {
    recipientId: string;
    subject: string;
    message: string;
    ticketId?: string;
  }) => {
    try {
      setIsSendingMessage(true);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create message in database
      const { error } = await supabase.from('user_messages').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        subject,
        message,
        related_ticket: ticketId || null
      });
      
      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }
      
      toast.success("Message sent successfully");
      
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Refresh conversations
      loadConversations();
      
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  const fetchMessages = async (ticketId: string): Promise<TicketMessage[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .eq('related_ticket', ticketId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      return data.map(msg => ({
        id: msg.id,
        ticketId: msg.related_ticket,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        subject: msg.subject,
        message: msg.message,
        createdAt: msg.created_at,
        read: msg.read,
        // Add sender field for compatibility
        sender: {
          id: msg.sender_id
        }
      }));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('user_messages')
        .update({ read: true })
        .eq('id', messageId);
      
      if (error) {
        console.error("Error marking message as read:", error);
      } else {
        // Update local state
        setConversations(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        );
        
        // Recalculate unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  return {
    isSendingMessage,
    sendMessage,
    fetchMessages,
    markMessageAsRead,
    conversations,
    loadConversations,
    unreadCount
  };
};
