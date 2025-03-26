
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "@/types/types";
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TicketTableViewProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  columns?: Array<{
    field: string;
    header: string;
    render?: (ticket: Ticket) => React.ReactNode;
  }>;
}

export const TicketTableView = ({
  tickets,
  onTicketClick,
  onTicketAction,
  columns = [
    { field: 'title', header: 'Title' },
    { field: 'status', header: 'Status' },
    { field: 'priority', header: 'Priority' },
  ]
}: TicketTableViewProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCellContent = (ticket: Ticket, field: string, render?: (ticket: Ticket) => React.ReactNode) => {
    if (render) {
      return render(ticket);
    }

    switch (field) {
      case 'title':
        return <span className="font-medium">{ticket.title}</span>;
      case 'status':
        return (
          <Badge className={getStatusColor(ticket.status)}>
            {getStatusIcon(ticket.status)}
            <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
          </Badge>
        );
      case 'priority':
        return (
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
        );
      case 'completion_percentage':
        return <span>{ticket.completion_percentage || 0}%</span>;
      case 'hours_logged':
        return <span>{ticket.hours_logged || 0} hrs</span>;
      default:
        return ticket[field as keyof Ticket] || '-';
    }
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground h-24">
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            tickets.map(ticket => (
              <TableRow key={ticket.id} onClick={() => onTicketClick(ticket)} className="cursor-pointer hover:bg-muted/50">
                {columns.map((column, index) => (
                  <TableCell key={index}>
                    {renderCellContent(ticket, column.field, column.render)}
                  </TableCell>
                ))}
                <TableCell className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    onTicketClick(ticket);
                  }}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
