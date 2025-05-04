
// This is the main file that re-exports all ticket services

import { loadTickets, fetchProjects } from './ticketLoaderService';
import { handleTicketAction } from './ticketActionService';
import { handleLogTime } from './timeTrackingService';
import { createTicket } from './ticketCreationService';
import { TicketService } from '@/components/ticket/TicketService';

// Re-export everything for backward compatibility
export {
  loadTickets,
  fetchProjects,
  handleTicketAction,
  handleLogTime,
  createTicket,
  TicketService
};
