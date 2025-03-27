
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';
import { KanbanColumn, Ticket, KanbanBoardProps, TicketCardProps } from '@/types/types';

export const KanbanBoard = ({
  columns,
  tickets,
  onTicketMove,
  onStatusChange,
  onTicketClick
}: KanbanBoardProps) => {
  // If tickets are provided but not columns, generate columns from ticket statuses
  const kanbanColumns = React.useMemo(() => {
    if (columns) return columns;
    
    if (tickets) {
      // Create default column structure
      const statusMap: Record<string, string> = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'review': 'In Review',
        'done': 'Done',
        'backlog': 'Backlog',
        'blocked': 'Blocked',
        'closed': 'Closed'
      };
      
      // Group tickets by status
      const groupedTickets: Record<string, Ticket[]> = {};
      
      tickets.forEach(ticket => {
        const status = ticket.status || 'todo';
        if (!groupedTickets[status]) {
          groupedTickets[status] = [];
        }
        groupedTickets[status].push(ticket);
      });
      
      // Convert to column format
      return Object.entries(statusMap).map(([id, title]) => ({
        id,
        title,
        tickets: groupedTickets[id] || []
      }));
    }
    
    return [];
  }, [columns, tickets]);

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Return if dropped outside a droppable area or in the same position
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Call the callback function with the ticket ID and new column ID
    if (onTicketMove) {
      onTicketMove(draggableId, destination.droppableId);
    } else if (onStatusChange) {
      onStatusChange(draggableId, destination.droppableId);
    }
  };

  // Render a simple card for tickets without needing the TicketCard component
  const renderTicketCard = (ticket: Ticket) => {
    return (
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1">{ticket.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            {ticket.priority}
          </span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
            {ticket.ticket_type || ticket.type || 'task'}
          </span>
        </div>
      </div>
    );
  };

  if (!kanbanColumns.length) {
    return <div className="text-center py-8">No tickets to display</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kanbanColumns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="mb-2 font-medium text-sm px-2">
              {column.title} ({column.tickets.length})
            </div>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-muted/30 rounded-lg p-2 flex-1 min-h-[300px]"
                >
                  {column.tickets.map((ticket, index) => (
                    <Draggable
                      key={ticket.id}
                      draggableId={ticket.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2"
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => onTicketClick && onTicketClick(ticket)}
                          >
                            {renderTicketCard(ticket)}
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
