import { useState, useEffect } from 'react';
import { Ticket, TicketStatistics } from '@/types/types';
import { supabase } from '@/lib/supabase';
import { enhanceTicket } from '@/utils/dataAdapters';

export const useTicketManagement = (initialTickets: Ticket[]) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStatistics>({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    updateTicketStatistics(tickets);
  }, [tickets]);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchQuery, statusFilter, priorityFilter, projectFilter, typeFilter]);

  const updateTicketStatistics = (ticketsData: Ticket[]) => {
    setTicketStats({
      total: ticketsData.length,
      open: ticketsData.filter(t => t.status !== 'done' && t.status !== 'closed').length,
      closed: ticketsData.filter(t => t.status === 'done' || t.status === 'closed').length,
      highPriority: ticketsData.filter(t => t.priority === 'high').length
    });
  };

  const applyFilters = () => {
    let filtered = [...tickets];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) || 
        (ticket.description && ticket.description.toLowerCase().includes(query))
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    if (projectFilter) {
      filtered = filtered.filter(ticket => ticket.project_id === projectFilter);
    }
    
    if (typeFilter) {
      filtered = filtered.filter(ticket => {
        const ticketType = ticket.type || ticket.ticket_type;
        return ticketType === typeFilter;
      });
    }
    
    setFilteredTickets(filtered);
  };

  const loadTickets = async (userId: string, projectId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(title)
        `);
      
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      } else {
        query = query.or(`assigned_to.eq.${userId},reporter.eq.${userId}`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTickets(data || []);
      setFilteredTickets(data || []);
      updateTicketStatistics(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const clearSelectedTicket = () => {
    setSelectedTicket(null);
  };

  const updateSelectedTicket = (updatedTicket: Ticket) => {
    if (!selectedTicket) return;
    
    const updatedTickets = tickets.map(t => 
      t.id === updatedTicket.id ? updatedTicket : t
    );
    
    setTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
  };

  return {
    tickets,
    filteredTickets,
    selectedTicket,
    ticketStats,
    loading,
    searchQuery,
    statusFilter,
    priorityFilter,
    projectFilter,
    typeFilter,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setProjectFilter,
    setTypeFilter,
    loadTickets,
    selectTicket,
    clearSelectedTicket,
    updateSelectedTicket
  };
};
