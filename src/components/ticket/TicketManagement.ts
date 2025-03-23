
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TicketStatistics, Ticket } from '@/types/types';
import { toast } from 'sonner';

export const useTicketManagement = (initialProject?: string) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProject || null);
  const [ticketStatistics, setTicketStatistics] = useState<TicketStatistics>({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });

  const fetchTickets = async (projectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('tickets').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Sanitize tickets to ensure no empty status or priority values
      const sanitizedTickets = (data || []).map(ticket => ({
        ...ticket,
        status: ticket.status || 'new',
        priority: ticket.priority || 'medium'
      }));
      
      setTickets(sanitizedTickets);
      calculateStatistics(sanitizedTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err as Error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (tickets: Ticket[]) => {
    const total = tickets.length;
    const openTicketsCount = tickets.filter(ticket => 
      ticket.status === 'new' || ticket.status === 'open').length;
    const closedTicketsCount = tickets.filter(ticket => 
      ticket.status === 'closed' || ticket.status === 'done').length;
    const inProgressCount = tickets.filter(ticket => 
      ticket.status === 'in-progress' || ticket.status === 'review').length;
    const highPriorityCount = tickets.filter(ticket => 
      ticket.priority === 'high').length;
    
    // Count by status
    const byStatus: Record<string, number> = {};
    tickets.forEach(ticket => {
      const status = ticket.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    // Count by priority
    const byPriority: Record<string, number> = {};
    tickets.forEach(ticket => {
      const priority = ticket.priority || 'unknown';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });
    
    setTicketStatistics({
      total,
      open: openTicketsCount,
      inProgress: inProgressCount, 
      completed: closedTicketsCount,
      totalTickets: total,
      openTickets: openTicketsCount,
      closedTickets: closedTicketsCount,
      highPriorityTickets: highPriorityCount,
      byStatus,
      byPriority
    });
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // Validate status to ensure it's never empty
      if (!newStatus || newStatus.trim() === '') {
        toast.error("Cannot update with an empty status value");
        return;
      }
      
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success("Ticket status updated");
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: newStatus } 
            : ticket
        )
      );
      
      // Recalculate statistics
      calculateStatistics(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus } 
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket");
    }
  };

  useEffect(() => {
    fetchTickets(selectedProjectId || undefined);
  }, [selectedProjectId]);

  return {
    tickets,
    loading,
    error,
    ticketStatistics,
    selectedProjectId,
    setSelectedProjectId,
    fetchTickets,
    updateTicketStatus
  };
};
