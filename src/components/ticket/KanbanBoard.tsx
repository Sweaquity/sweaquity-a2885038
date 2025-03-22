
// TicketKanbanBoard.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Ticket, DragResult } from "@/types/types";

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onViewTicket: (ticketId: string) => void;
}

export const TicketKanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onViewTicket
}) => {
  const getKanbanData = () => {
    const columns = {
      'new': { id: 'new', title: 'New', ticketIds: [] as string[] },
      'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] as string[] },
      'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] as string[] },
      'review': { id: 'review', title: 'Review', ticketIds: [] as string[] },
      'done': { id: 'done', title: 'Done', ticketIds: [] as string[] },
      'closed': { id: 'closed', title: 'Closed', ticketIds: [] as string[] }
    };
    
    const ticketMap: Record<string, Ticket> = {};
    
    tickets.forEach(ticket => {
      ticketMap[ticket.id] = ticket;
      const status = ticket.status || 'new';
      if (columns[status as keyof typeof columns]) {
        columns[status as keyof typeof columns].ticketIds.push(ticket.id);
      } else {
        columns['new'].ticketIds.push(ticket.id);
      }
    });
    
    return { columns, tickets: ticketMap };
  };

  const onDragEnd = (result: DragResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    onStatusChange(draggableId, destination.droppableId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  const { columns, tickets: ticketMap } = getKanbanData();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="overflow-x-auto p-4">
        <div className="flex space-x-4 min-w-fit">
          {Object.values(columns).map(column => (
            <div key={column.id} className="w-64 bg-gray-50 rounded-md p-2">
              <h3 className="font-medium mb-2">{column.title} ({column.ticketIds.length})</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[50px]"
                  >
                    {column.ticketIds.map((ticketId, index) => {
                      const ticket = ticketMap[ticketId];
                      return (
                        <Draggable key={ticketId} draggableId={ticketId} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card className={`
                                p-2 cursor-pointer
                                ${ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
                                  ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                                  'border-l-4 border-l-blue-500'}`
                              }>
                                <div className="text-sm font-medium">{ticket.title}</div>
                                <div className="text-xs text-gray-500 truncate">{ticket.description}</div>
                                <div className="flex justify-between mt-1">
                                  <div className="text-xs">{formatDate(ticket.due_date)}</div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewTicket(ticket.id);
                                    }}
                                  >
                                    View
                                  </Button>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

// Export with alias for backward compatibility
export { TicketKanbanBoard as KanbanBoard };
