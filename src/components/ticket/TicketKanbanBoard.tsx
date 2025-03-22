
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types/types';

export interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onTicketClick?: (ticket: Ticket) => void;
  viewOnly?: boolean;
}

export const TicketKanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onTicketClick,
  viewOnly = false
}) => {
  // Define columns for the kanban board
  const columns = [
    { id: 'new', title: 'New' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'blocked', title: 'Blocked' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
    { id: 'closed', title: 'Closed' }
  ];

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    if (viewOnly) return;
    e.dataTransfer.setData('ticketId', ticket.id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (viewOnly) return;
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, columnId: string) => {
    if (viewOnly) return;
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    onStatusChange(ticketId, columnId);
  };

  // Function to determine appropriate color for priority badge
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
      {columns.map(column => (
        <div key={column.id} className="flex flex-col h-full">
          <div className="bg-muted p-2 rounded-t-md text-center font-medium">
            {column.title}
            <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
              {tickets.filter(t => t.status === column.id).length}
            </span>
          </div>
          <div
            className="flex-1 bg-muted/30 p-2 rounded-b-md min-h-[400px] overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {tickets
              .filter(ticket => ticket.status === column.id)
              .map(ticket => (
                <Card
                  key={ticket.id}
                  className="mb-2 cursor-pointer"
                  draggable={!viewOnly}
                  onDragStart={(e) => handleDragStart(e, ticket)}
                  onClick={() => onTicketClick?.(ticket)}
                >
                  <CardContent className="p-3">
                    <div className="text-sm font-medium mb-1">{ticket.title}</div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(ticket.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
