
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, TicketStatsProps } from '@/types/types';

const TicketStats: React.FC<TicketStatsProps> = ({ tickets }) => {
  // Calculate ticket statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(ticket => 
    ticket.status !== 'done' && ticket.status !== 'closed'
  ).length;
  const closedTickets = tickets.filter(ticket => 
    ticket.status === 'done' || ticket.status === 'closed'
  ).length;
  const highPriorityTickets = tickets.filter(ticket => 
    ticket.priority === 'high' || ticket.priority === 'critical'
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{totalTickets}</div>
          <p className="text-sm text-muted-foreground">Total Tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{openTickets}</div>
          <p className="text-sm text-muted-foreground">Open Tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{closedTickets}</div>
          <p className="text-sm text-muted-foreground">Closed Tickets</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-2xl font-bold">{highPriorityTickets}</div>
          <p className="text-sm text-muted-foreground">High Priority</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketStats;
