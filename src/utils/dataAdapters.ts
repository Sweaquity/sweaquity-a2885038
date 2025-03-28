
import { Ticket } from "@/types/types";

/**
 * Enhances a ticket object with default values for required fields
 */
export const enhanceTicket = (ticket: any): Ticket => {
  return {
    ...ticket,
    description: ticket.description || "",
    health: ticket.health || "good",
    type: ticket.type || ticket.ticket_type || "task",
    ticket_type: ticket.ticket_type || ticket.type || "task",
    isTaskTicket: !!ticket.task_id,
    isProjectTicket: !!ticket.project_id && !ticket.task_id
  };
};

/**
 * Enhances an array of tickets with default values
 */
export const enhanceTickets = (tickets: any[]): Ticket[] => {
  return tickets.map(ticket => enhanceTicket(ticket));
};
