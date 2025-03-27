
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Ticket } from "@/types/types";

interface TicketItemProps {
  ticket: Ticket;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  onTicketAction,
  onLogTime,
  renderTicketActions
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
      case "todo":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
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
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
      case "todo":
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      case "blocked":
        return <AlertTriangle className="h-4 w-4" />;
      case "review":
        return <AlertCircle className="h-4 w-4" />;
      case "done":
      case "closed":
        return <Check className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  const getTicketTypeLabel = (ticket: Ticket) => {
    // Use ticket_type if available, otherwise fall back to type
    const ticketType = ticket.ticket_type || ticket.type || "task";
    
    switch (ticketType) {
      case "task":
        return "Task";
      case "bug":
        return "Bug";
      case "feature":
        return "Feature";
      case "beta-test":
      case "beta_testing":
        return "Beta Test";
      default:
        return ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
    }
  };

  return (
    <Card className="mb-4">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium">{ticket.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                {getStatusIcon(ticket.status)} <span className="ml-1">{ticket.status}</span>
              </Badge>
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline">
                {getTicketTypeLabel(ticket)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {renderTicketActions && renderTicketActions(ticket)}
            <Button variant="ghost" size="sm" onClick={toggleExpanded}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Due date:</span> {formatDate(ticket.due_date)}
                </p>
                {ticket.estimated_hours !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Estimated hours:</span> {ticket.estimated_hours}
                  </p>
                )}
                {ticket.hours_logged !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Hours logged:</span> {ticket.hours_logged}
                  </p>
                )}
              </div>
              
              <div>
                {ticket.completion_percentage !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">Completion:</span> {ticket.completion_percentage}%
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${ticket.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description || "No description provided."}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              {onLogTime && (
                <Button size="sm" variant="outline" onClick={() => onLogTime(ticket.id)}>
                  Log Time
                </Button>
              )}
              {onTicketAction && (
                <Button size="sm" onClick={() => onTicketAction(ticket.id, "viewDetails", null)}>
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
