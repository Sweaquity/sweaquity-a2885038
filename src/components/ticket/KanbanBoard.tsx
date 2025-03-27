
import React from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Ticket } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Clock, MoreHorizontal, CheckCircle } from "lucide-react";

export interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onTicketClick?: (ticket: Ticket) => void;  
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tickets, onStatusChange, onTicketClick }) => {
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

  // Function to get ticket count for a specific status
  const getTicketCount = (status: string) => {
    return tickets.filter(ticket => ticket.status === status).length;
  };

  // Function to determine priority badge color
  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Determine if a ticket is overdue
  const isOverdue = (ticket: Ticket) => {
    if (!ticket.due_date) return false;
    const dueDate = new Date(ticket.due_date);
    const today = new Date();
    return dueDate < today;
  };

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Call the onStatusChange callback to update the ticket status
    onStatusChange(draggableId, newStatus);
  };

  // Sort tickets based on priority and due date
  const sortTickets = (tickets: Ticket[]) => {
    return [...tickets].sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 999;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 999;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then sort by due date if available
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      // If no due date, tickets with due dates come first
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      
      // Finally sort by creation date
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return 0;
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map(column => {
          // Map statuses that might be in different formats
          let columnTickets = tickets.filter(ticket => {
            // Check if the ticket status matches the column id directly
            if (ticket.status === column.id) return true;
            
            // Handle alternative status formats
            if (column.id === 'in-progress' && (ticket.status === 'in_progress' || ticket.status === 'in progress')) return true;
            if (column.id === 'todo' && (ticket.status === 'new' || ticket.status === 'open' || ticket.status === 'backlog' || ticket.status === 'to-do' || ticket.status === 'to_do')) return true;
            
            return false;
          });
          
          return (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-gray-50 p-3 rounded-lg min-h-[300px]"
                >
                  <h3 className="font-medium text-sm mb-3">{column.title} ({columnTickets.length})</h3>
                  
                  {sortTickets(columnTickets).map((ticket, index) => (
                    <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white mb-2 p-3 rounded-md shadow-sm border border-gray-100"
                          onClick={() => onTicketClick && onTicketClick(ticket)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{ticket.title}</h4>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              getPriorityColor(ticket.priority)
                            }`}>
                              {ticket.priority}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{ticket.description}</p>
                          
                          {ticket.ticket_type && (
                            <div className="mt-2 flex items-center text-xs text-blue-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>{ticket.ticket_type}</span>
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
                                onTicketClick && onTicketClick(ticket);
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
    </DragDropContext>
  );
};
