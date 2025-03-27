
import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '@/types/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useTicketManagement = (userId?: string) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get tickets assigned to the user
      const { data: assignedTickets, error: assignedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', userId);
      
      if (assignedError) throw assignedError;
      
      // Get tickets created by the user
      const { data: reportedTickets, error: reportedError } = await supabase
        .from('tickets')
        .select('*')
        .eq('reporter', userId);
      
      if (reportedError) throw reportedError;
      
      // Combine and deduplicate tickets
      const allTickets = [...(assignedTickets || []), ...(reportedTickets || [])];
      const uniqueTickets = Array.from(
        new Map(allTickets.map(ticket => [ticket.id, ticket])).values()
      );
      
      setTickets(uniqueTickets);
      setError(null);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tickets'));
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onCreateTicket = async (ticketData: any) => {
    if (!userId) {
      toast.error("You must be logged in to create tickets");
      return;
    }

    try {
      // Ensure we have the required fields
      const newTicket = {
        ...ticketData,
        reporter: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: ticketData.status || 'todo',
        priority: ticketData.priority || 'medium',
        health: ticketData.health || 'green',
        ticket_type: ticketData.ticket_type || 'task',
        description: ticketData.description || '',
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select()
        .single();

      if (error) throw error;

      toast.success("Ticket created successfully");
      setTickets(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Error creating ticket:", err);
      toast.error("Failed to create ticket");
      throw err;
    }
  };

  const onStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );

      toast.success("Ticket status updated");
    } catch (err) {
      console.error("Error updating ticket status:", err);
      toast.error("Failed to update ticket status");
    }
  };

  const onTicketClick = (ticket: Ticket) => {
    setExpandedTicket(ticket);
  };

  const onReply = async (message: string) => {
    if (!expandedTicket || !userId) return;

    try {
      // Get current notes array
      const { data: ticketData, error: getError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', expandedTicket.id)
        .single();

      if (getError) throw getError;

      const notes = ticketData?.notes || [];
      const newNote = {
        id: Date.now().toString(),
        user: userId, // Ideally, this would be the user's name, not just ID
        timestamp: new Date().toISOString(),
        comment: message
      };

      const updatedNotes = [...notes, newNote];

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', expandedTicket.id);

      if (updateError) throw updateError;

      // Update local state
      setExpandedTicket(prev => prev ? { ...prev, notes: updatedNotes } : null);
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === expandedTicket.id ? { ...ticket, notes: updatedNotes } : ticket
        )
      );

      toast.success("Reply added");
    } catch (err) {
      console.error("Error adding reply:", err);
      toast.error("Failed to add reply");
    }
  };

  return {
    tickets,
    isLoading,
    error,
    onCreateTicket,
    onStatusChange,
    onTicketClick,
    expandedTicket,
    onReply,
    refreshTickets: fetchTickets
  };
};
