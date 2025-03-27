
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TicketCard } from './TicketCard';
import { Card } from '@/components/ui/card';
import { KanbanColumn, Ticket } from '@/types/types';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onTicketMove?: (ticketId: string, newColumnId: string) => Promise<void>;
  onTicketClick?: (ticket: Ticket) => void;
}

export const KanbanBoard = ({
  columns,
  onTicketMove,
  onTicketClick
}: KanbanBoardProps) => {
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
    }
  };

  // Get appropriate icon based on ticket type
  const getTicketType = (ticket: Ticket) => {
    // Check both ticket_type (new property) and type (old property) for compatibility
    const ticketType = ticket.ticket_type || ticket.type || 'task';
    
    if (ticketType === 'bug') {
      return 'bug';
    } else if (ticketType === 'feature') {
      return 'feature';
    } else if (ticketType === 'improvement') {
      return 'improvement';
    } else {
      return 'task';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
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
                            <TicketCard
                              title={ticket.title}
                              description={ticket.description}
                              type={getTicketType(ticket)}
                              priority={ticket.priority}
                              status={ticket.status}
                              ticketId={ticket.id}
                              assignee={ticket.assigned_to}
                              health={ticket.health}
                              dueDate={ticket.due_date}
                              completionPercentage={ticket.completion_percentage}
                            />
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
