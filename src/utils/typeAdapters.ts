import { Ticket as InterfaceTicket } from '@/types/interfaces';
import { Ticket as LegacyTicket } from '@/types/types';

/**
 * Adapts a legacy ticket to the new interface format
 */
export function adaptTicket(ticket: LegacyTicket): InterfaceTicket {
  return {
    ...ticket,
    // Ensure required fields are present
    type: ticket.ticket_type || ticket.type || 'task',
    description: ticket.description || '',
    // Keep backward compatibility
    ticket_type: ticket.ticket_type || ticket.type || 'task',
  };
}

/**
 * Adapts an array of legacy tickets to the new interface format
 */
export function adaptTickets(tickets: LegacyTicket[]): InterfaceTicket[] {
  return tickets.map(adaptTicket);
}

/**
 * Helper to convert between JobApplication formats
 */
export function adaptJobApplication(application: any): any {
  return {
    ...application,
    id: application.id || application.job_app_id,
    job_app_id: application.job_app_id || application.id,
  };
}

/**
 * Adapts an array of job applications
 */
export function adaptJobApplications(applications: any[]): any[] {
  return applications.map(adaptJobApplication);
}
