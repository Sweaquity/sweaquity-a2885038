import { Ticket } from "@/types/types";

export interface TicketFilters {
  search?: string;
  status?: string;
  priority?: string;
  type?: string;
}

export const filterTickets = (tickets: Ticket[], filters: TicketFilters): Ticket[] => {
  return tickets.filter(ticket => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!ticket.title.toLowerCase().includes(searchTerm) &&
          !ticket.description.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }

    if (filters.status && filters.status !== 'all') {
      if (ticket.status !== filters.status) {
        return false;
      }
    }

    if (filters.priority && filters.priority !== 'all') {
      if (ticket.priority !== filters.priority) {
        return false;
      }
    }

    if (filters.type && filters.type !== 'all') {
      const ticketType = ticket.ticket_type || ticket.type;
      if (ticketType !== filters.type) {
        return false;
      }
    }

    return true;
  });
};

export const sortTickets = (tickets: Ticket[], sortBy: string, sortOrder: string): Ticket[] => {
  const sortedTickets = [...tickets];

  sortedTickets.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        comparison = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dueDate':
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        comparison = a.title.localeCompare(b.title);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedTickets;
};
