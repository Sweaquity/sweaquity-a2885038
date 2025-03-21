
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface BetaTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  ticketIds: string[];
}

export interface KanbanBoardProps {
  tickets: BetaTicket[];
  onStatusChange?: (ticketId: string, newStatus: string) => void;
  onTicketClick?: (ticketId: string) => void;
}

export function KanbanBoard({ tickets, onStatusChange = () => {}, onTicketClick = () => {} }: KanbanBoardProps) {
  const getInitialColumns = () => {
    const columns: Record<string, KanbanColumn> = {
      'new': { id: 'new', title: 'New', ticketIds: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
      'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] },
      'review': { id: 'review', title: 'Review', ticketIds: [] },
      'done': { id: 'done', title: 'Done', ticketIds: [] },
      'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
    };
    
    tickets.forEach(ticket => {
      const status = ticket.status || 'new';
      if (columns[status]) {
        columns[status].ticketIds.push(ticket.id);
      } else {
        columns['new'].ticketIds.push(ticket.id);
      }
    });
    
    return columns;
  };

  const [columns, setColumns] = useState<Record<string, KanbanColumn>>(getInitialColumns);
  const [ticketsMap, setTicketsMap] = useState(() => {
    const map: Record<string, BetaTicket> = {};
    tickets.forEach(ticket => {
      map[ticket.id] = ticket;
    });
    return map;
  });

  const onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Remove from source column
    const sourceColumn = columns[source.droppableId];
    const sourceTicketIds = [...sourceColumn.ticketIds];
    sourceTicketIds.splice(source.index, 1);
    
    // Add to destination column
    const destinationColumn = columns[destination.droppableId];
    const destinationTicketIds = [...destinationColumn.ticketIds];
    destinationTicketIds.splice(destination.index, 0, draggableId);
    
    // Update columns state
    setColumns({
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        ticketIds: sourceTicketIds
      },
      [destination.droppableId]: {
        ...destinationColumn,
        ticketIds: destinationTicketIds
      }
    });
    
    // Update ticket status in the database
    if (onStatusChange) {
      onStatusChange(draggableId, destination.droppableId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

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
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 min-h-[100px]"
                  >
                    {column.ticketIds.map((ticketId, index) => {
                      const ticket = ticketsMap[ticketId];
                      if (!ticket) return null;
                      
                      return (
                        <Draggable key={ticketId} draggableId={ticketId} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                p-2 cursor-pointer
                                ${ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
                                  ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                                  'border-l-4 border-l-blue-500'}`
                              }
                            >
                              <div className="text-sm font-medium">{ticket.title}</div>
                              <div className="text-xs text-gray-500 truncate">{ticket.description}</div>
                              <div className="flex justify-between mt-1">
                                <div className="text-xs">{formatDate(ticket.due_date)}</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={() => onTicketClick(ticket.id)}
                                >
                                  View
                                </Button>
                              </div>
                            </Card>
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
}
