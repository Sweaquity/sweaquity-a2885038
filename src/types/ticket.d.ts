
import { ReactNode } from 'react';
import { Ticket } from './types';

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => ReactNode;
  expandedTickets?: Set<string> | Record<string, boolean>;
  toggleTicketExpansion?: (ticketId: string) => void;
  userCanEditDates?: boolean;
  userCanEditStatus?: boolean;
  loading?: boolean;
}
