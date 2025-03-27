
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Info, PencilRuler, User, Calendar } from "lucide-react";
import { Ticket } from "@/types/types";
import { format } from "date-fns";

interface TicketItemProps {
  ticket: Ticket;
  onExpand: (ticket: Ticket) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  onLogTime?: (ticketId: string) => void;
  renderActions?: () => React.ReactNode;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  onExpand,
  onTicketAction,
  showTimeTracking = false,
  onLogTime,
  renderActions
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "No due date";
    try {
      return format(new Date(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {ticket.description}
            </p>
          </div>
          <div className="flex space-x-2">
            <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
          {ticket.due_date && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Due: {formatDate(ticket.due_date)}</span>
            </div>
          )}
          
          {ticket.assigned_to && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>Assigned</span>
            </div>
          )}
          
          {ticket.estimated_hours != null && (
            <div className="flex items-center">
              <PencilRuler className="h-3 w-3 mr-1" />
              <span>Est: {ticket.estimated_hours}h</span>
            </div>
          )}
          
          {ticket.hours_logged != null && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>Logged: {ticket.hours_logged}h</span>
            </div>
          )}
          
          {ticket.ticket_type && (
            <div className="flex items-center">
              <Info className="h-3 w-3 mr-1" />
              <span>Type: {ticket.ticket_type}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-3 space-x-2">
          {showTimeTracking && onLogTime && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onLogTime(ticket.id)}
            >
              <Clock className="h-4 w-4 mr-1" />
              Log Time
            </Button>
          )}
          
          {renderActions && renderActions()}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onExpand(ticket)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};
