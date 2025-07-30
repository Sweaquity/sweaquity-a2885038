
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TicketMessage } from "@/types/dashboard";

export const useTicketsAndMessages = () => {
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);

  const loadUserTickets = useCallback(async (userId: string) => {
    try {
      const { data: reportedTickets, error: reportedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('reporter', userId);
      
      if (reportedError) {
        console.error("Error fetching reported tickets:", reportedError);
        return;
      }

      const { data: assignedTickets, error: assignedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', userId);
      
      if (assignedError) {
        console.error("Error fetching assigned tickets:", assignedError);
        return;
      }

      const allTickets = [...(reportedTickets || []), ...(assignedTickets || [])];
      const uniqueTickets = Array.from(new Map(allTickets.map(ticket => [ticket.id, ticket])).values());
      
      setUserTickets(uniqueTickets);

      await loadTicketMessages(userId, uniqueTickets.map(t => t.id));
      
    } catch (error) {
      console.error("Error loading user tickets:", error);
    }
  }, []);

  const loadTicketMessages = useCallback(async (userId: string, ticketIds: string[]) => {
    if (!ticketIds.length) return;
    
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .eq('recipient_id', userId)
        .in('related_ticket', ticketIds);
      
      if (messagesError) {
        console.error("Error fetching ticket messages:", messagesError);
        return;
      }
      
      setTicketMessages(messages || []);
      
    } catch (error) {
      console.error("Error loading ticket messages:", error);
    }
  }, []);

  const handleTicketAction = useCallback(async (ticketId: string, action: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to perform this action");
        return;
      }
      
      if (action === 'reply') {
        const { message } = data || {};
        
        if (!message || !message.trim()) {
          toast.error("Message cannot be empty");
          return;
        }
        
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('reporter, assigned_to')
          .eq('id', ticketId)
          .single();
          
        if (ticketError) {
          console.error("Error fetching ticket:", ticketError);
          toast.error("Failed to send reply");
          return;
        }
        
        let recipientId = user.id === ticketData.reporter 
          ? ticketData.assigned_to 
          : ticketData.reporter;
          
        if (!recipientId) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('user_id')
            .limit(1)
            .single();
            
          recipientId = adminData?.user_id;
        }
        
        if (!recipientId) {
          toast.error("No recipient found for your message");
          return;
        }
        
        const { error: messageError } = await supabase
          .from('user_messages')
          .insert({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: `Re: Ticket #${ticketId.substring(0, 8)}`,
            message: message,
            related_ticket: ticketId,
            read: false
          });
          
        if (messageError) {
          console.error("Error sending message:", messageError);
          toast.error("Failed to send message");
          return;
        }
        
        const { data: ticketNotesData, error: notesError } = await supabase
          .from('tickets')
          .select('notes')
          .eq('id', ticketId)
          .single();
          
        if (notesError) {
          console.error("Error fetching ticket notes:", notesError);
          toast.error("Message sent but failed to update ticket history");
          return;
        }
        
        const notes = ticketNotesData.notes || [];
        
        const { data: userData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single();
          
        const userName = userData?.first_name 
          ? `${userData.first_name} ${userData.last_name || ''}`
          : userData?.email || user.email || 'Unknown User';
        
        notes.push({
          action: user.id === ticketData.reporter ? 'Reply from reporter' : 'Reply from assignee',
          user: userName,
          timestamp: new Date().toISOString(),
          comment: message
        });
        
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        if (updateError) {
          console.error("Error updating ticket notes:", updateError);
          toast.error("Message sent but failed to update ticket history");
          return;
        }
        
        toast.success("Message sent successfully");
        
        // Reload ticket messages
        const session = await supabase.auth.getSession();
        if (session.data.session) {
          await loadTicketMessages(session.data.session.user.id, [ticketId]);
        }
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to perform ticket action");
    }
  }, [loadTicketMessages]);

  return {
    userTickets,
    ticketMessages,
    loadUserTickets,
    loadTicketMessages,
    handleTicketAction
  };
};
