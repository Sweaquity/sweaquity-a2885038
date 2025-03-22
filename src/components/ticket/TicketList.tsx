
import React, { useState } from "react";
import { Ticket } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Calendar,
  CheckCircle2,
  User,
  MessageSquare
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketDetails } from "./TicketDetails";
import { TimeTracker } from "../job-seeker/dashboard/TimeTracker";
import { supabase } from "@/lib/supabase";

interface TicketListProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  onPriorityChange: (ticketId: string, newPriority: string) => void;
  onDueDateChange: (ticketId: string, newDueDate: string) => void;
  formatDate: (dateString: string) => string;
  onTicketClick?: (ticket: Ticket) => void;
  viewOnly?: boolean;
  onApproveEquity?: (ticket: Ticket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  formatDate,
  onTicketClick,
  viewOnly = false,
  onApproveEquity
}) => {
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [showTimeTracker, setShowTimeTracker] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  React.useEffect(() => {
    // Get the current user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    getUser();
  }, []);

  const toggleExpand = (ticketId: string) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const toggleTimeTracker = (ticketId: string) => {
    setShowTimeTracker(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  // Function to check if a ticket is eligible for equity approval
  const canApproveEquity = (ticket: Ticket) => {
    // For regular tasks, status must be 'done' and have task_id and job_app_id
    if (ticket.task_id && ticket.job_app_id && ticket.status === 'done') {
      return true;
    }
    
    // For beta testing tasks, status must be 'done' and be in specific project
    if (ticket.project_id === "1ec133ba-26d6-4112-8e44-f0b67ddc8fb4" && ticket.status === 'done') {
      return true;
    }
    
    return false;
  };

  // Function to determine if a ticket should show time tracking
  const shouldShowTimeTracking = (ticket: Ticket) => {
    // Only show time tracking for task-related tickets (not beta testing)
    return ticket.task_id && ticket.job_app_id;
  };

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id} className="border">
            <CardContent className="p-0">
              <div 
                className="p-4 cursor-pointer flex justify-between items-start"
                onClick={() => onTicketClick ? onTicketClick(ticket) : toggleExpand(ticket.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{ticket.title}</h3>
                    <Badge 
                      variant="outline" 
                      className="ml-2"
                    >
                      {ticket.status}
                    </Badge>
                    {ticket.priority === 'high' && (
                      <Badge 
                        variant="outline" 
                        className="ml-2 bg-red-100 text-red-800 border-red-300"
                      >
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {ticket.description}
                  </p>
                  <div className="flex items-center mt-2 space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Created: {formatDate(ticket.created_at)}</span>
                    </div>
                    {ticket.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Due: {new Date(ticket.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {ticket.assigned_to && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>Assigned</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {!onTicketClick && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(ticket.id);
                    }}
                  >
                    {expandedTickets[ticket.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              {expandedTickets[ticket.id] && !onTicketClick && (
                <>
                  <Separator />
                  
                  <div className="p-4">
                    {!viewOnly && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {canApproveEquity(ticket) && onApproveEquity && (
                          <Button 
                            size="sm" 
                            onClick={() => onApproveEquity(ticket)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve & Allocate Equity
                          </Button>
                        )}
                        
                        {shouldShowTimeTracking(ticket) && currentUserId && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTimeTracker(ticket.id);
                            }}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {showTimeTracker[ticket.id] ? "Hide Time Tracker" : "Log Time"}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {showTimeTracker[ticket.id] && currentUserId && (
                      <div className="mb-4 p-4 bg-secondary/20 rounded-md">
                        <TimeTracker 
                          ticketId={ticket.id} 
                          userId={currentUserId}
                          jobAppId={ticket.job_app_id}
                        />
                      </div>
                    )}
                    
                    <TicketDetails
                      ticket={ticket}
                      onStatusChange={onStatusChange}
                      onPriorityChange={onPriorityChange}
                      onDueDateChange={onDueDateChange}
                      formatDate={formatDate}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
