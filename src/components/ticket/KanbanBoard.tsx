
import React from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Ticket } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Clock, MoreHorizontal, CheckCircle } from "lucide-react";

export interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onTicketClick?: (ticket: Ticket) => void;  // Made this prop optional
}

export const KanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onTicketClick = () => {},  // Default empty function
}) => {
  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
    { id: 'closed', title: 'Closed' }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {columns.map(column => {
        const columnTickets = tickets.filter(ticket => ticket.status === column.id);
        
        return (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="bg-gray-50 p-3 rounded-lg min-h-[300px]"
              >
                <h3 className="font-medium text-sm mb-3">{column.title} ({columnTickets.length})</h3>
                
                {columnTickets.map((ticket, index) => (
                  <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white mb-2 p-3 rounded-md shadow-sm border border-gray-100"
                        onClick={() => onTicketClick(ticket)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{ticket.title}</h4>
                          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{ticket.description}</p>
                        
                        {ticket.isTaskTicket && (
                          <div className="mt-2 flex items-center text-xs text-blue-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span>Task Ticket</span>
                            {ticket.equity_points !== undefined && ticket.equity_points > 0 && (
                              <span className="ml-1">(Equity: {ticket.equity_points}%)</span>
                            )}
                          </div>
                        )}
                        
                        {ticket.due_date && (
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Due: {formatDate(ticket.due_date)}</span>
                          </div>
                        )}
                        
                        <div className="mt-2 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onTicketClick(ticket);
                            }}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );
};
