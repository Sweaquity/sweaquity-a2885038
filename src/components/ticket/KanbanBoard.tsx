import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Eye, Clock, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Ticket } from "@/types/types";
import { enhanceTicket } from "@/utils/dataAdapters";

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onTicketClick
}) => {
  const [columns, setColumns] = useState<{[key: string]: any}>({
    todo: { id: 'todo', title: 'To Do', ticketIds: [] },
    in_progress: { id: 'in_progress', title: 'In Progress', ticketIds: [] },
    in_review: { id: 'in_review', title: 'In Review', ticketIds: [] },
    done: { id: 'done', title: 'Done', ticketIds: [] }
  });
  
  const [ticketsMap, setTicketsMap] = useState<{[key: string]: Ticket}>({});
  
  useEffect(() => {
    // Process tickets to ensure they have all required fields
    const processedTickets = tickets.map(ticket => enhanceTicket(ticket));
    
    // Group tickets by status
    const todoIds: string[] = [];
    const inProgressIds: string[] = [];
    const inReviewIds: string[] = [];
    const doneIds: string[] = [];
    
    const ticketsObj: {[key: string]: Ticket} = {};
    
    processedTickets.forEach(ticket => {
      // Add to appropriate status column
      if (ticket.status === 'todo' || ticket.status === 'new' || ticket.status === 'open') {
        todoIds.push(ticket.id);
      } else if (ticket.status === 'in_progress' || ticket.status === 'progress') {
        inProgressIds.push(ticket.id);
      } else if (ticket.status === 'in_review' || ticket.status === 'review') {
        inReviewIds.push(ticket.id);
      } else if (ticket.status === 'done' || ticket.status === 'closed') {
        doneIds.push(ticket.id);
      } else {
        // Default to todo
        todoIds.push(ticket.id);
      }
      
      // Add to tickets map
      ticketsObj[ticket.id] = ticket;
    });
    
    // Update columns
    setColumns({
      todo: { id: 'todo', title: 'To Do', ticketIds: todoIds },
      in_progress: { id: 'in_progress', title: 'In Progress', ticketIds: inProgressIds },
      in_review: { id: 'in_review', title: 'In Review', ticketIds: inReviewIds },
      done: { id: 'done', title: 'Done', ticketIds: doneIds }
    });
    
    // Update tickets map
    setTicketsMap(ticketsObj);
  }, [tickets]);

  // Determine badge color based on ticket type
  const getTypeColor = (ticket: Ticket) => {
    // Use either type or ticket_type, whichever is available
    const ticketType = ticket.type || ticket.ticket_type;
    const isTask = ticket.isTaskTicket || ticketType === 'task';
    const isProject = ticket.isProjectTicket || ticketType === 'project';
    
    if (isTask) {
      return 'bg-blue-100 text-blue-800';
    } else if (isProject) {
      return 'bg-purple-100 text-purple-800';
    } else if (ticketType === 'bug') {
      return 'bg-red-100 text-red-800';
    } else if (ticketType === 'beta-test') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    e.dataTransfer.setData("text/plain", ticketId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("text/plain");
    if (ticketId) {
      onStatusChange(ticketId, columnId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 min-w-fit">
        {Object.values(columns).map(column => (
          <div 
            key={column.id} 
            className="w-64 bg-gray-50 rounded-md p-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h3 className="font-medium mb-2">{column.title} ({column.ticketIds.length})</h3>
            <div className="space-y-2">
              {column.ticketIds.map((ticketId) => {
                const ticket = ticketsMap[ticketId];
                if (!ticket) return null;
                
                return (
                  <Card 
                    key={ticketId} 
                    className={`
                      p-2 cursor-pointer
                      ${ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
                        ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-blue-500'}
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticketId)}
                    onClick={() => onTicketClick(ticket)}
                  >
                    <div className="text-sm font-medium">{ticket.title}</div>
                    <div className="text-xs text-gray-500 truncate">{ticket.description}</div>
                    <div className="flex justify-between mt-1">
                      <div className="text-xs">{ticket.due_date ? formatDate(ticket.due_date) : 'No due date'}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => onTicketClick(ticket)}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
