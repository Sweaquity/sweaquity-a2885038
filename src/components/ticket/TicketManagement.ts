import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket, TicketStatistics } from "@/types/types";

export const useTicketManagement = (initialTickets: Ticket[] = []) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [stats, setStats] = useState<TicketStatistics>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    completedTickets: 0,
    overdueTickets: 0,
    total: 0, // Added to match updated interface
  });

  useEffect(() => {
    calculateTicketStats();
  }, [tickets]);

  const calculateTicketStats = () => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'new').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
    const completedTickets = tickets.filter(t => ['done', 'closed'].includes(t.status)).length;
    const overdueTickets = tickets.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && !['done', 'closed'].includes(t.status);
    }).length;

    setStats({
      totalTickets,
      openTickets,
      inProgressTickets,
      completedTickets,
      overdueTickets,
      total: totalTickets, // Added to match updated interface
      open: openTickets, // Added to match updated interface
    });
  };

  const addTicket = (newTicket: Ticket) => {
    setTickets(prevTickets => [...prevTickets, newTicket]);
    calculateTicketStats();
  };

  const updateTicket = (updatedTicket: Ticket) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );
    calculateTicketStats();
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
    calculateTicketStats();
  };
  
  return {
    tickets,
    stats,
    addTicket,
    updateTicket,
    deleteTicket,
  };
};
