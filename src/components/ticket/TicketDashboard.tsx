import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket } from "@/types/types";
import { CalendarIcon, CheckCircle, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketExpand?: (ticketId: string, isExpanded: boolean) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => void;
  showTimeTracking?: boolean;
  currentUserId?: string;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = React.memo(({ 
  initialTickets, 
  onRefresh,
  onTicketExpand,
  onTicketAction,
  showTimeTracking = false,
  currentUserId
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Memoize the initial tickets to prevent unnecessary re-renders
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const toggleTicketExpanded = useCallback((ticketId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, expanded: !ticket.expanded }
          : ticket
      )
    );

    // Call external expand handler if provided
    if (onTicketExpand) {
      onTicketExpand(ticketId, !tickets.find(t => t.id === ticketId)?.expanded);
    }
  }, [onTicketExpand, tickets]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleStatusChange = useCallback((ticketId: string, newStatus: string) => {
    if (onTicketAction) {
      onTicketAction(ticketId, 'updateStatus', newStatus);
    }
  }, [onTicketAction]);

  const handlePriorityChange = useCallback((ticketId: string, newPriority: string) => {
    if (onTicketAction) {
      onTicketAction(ticketId, 'updatePriority', newPriority);
    }
  }, [onTicketAction]);

  const handleDueDateChange = useCallback((ticketId: string, newDate: Date) => {
    if (onTicketAction) {
      onTicketAction(ticketId, 'updateDueDate', newDate.toISOString().split('T')[0]);
    }
  }, [onTicketAction]);

  const handleAddNote = useCallback((ticketId: string, note: string) => {
    if (onTicketAction) {
      onTicketAction(ticketId, 'addNote', note);
    }
  }, [onTicketAction]);

  const handleCompletionChange = useCallback((ticketId: string, completion: number) => {
    if (onTicketAction) {
      onTicketAction(ticketId, 'updateCompletion', completion);
    }
  }, [onTicketAction]);

  // Memoize filtered tickets to prevent unnecessary re-renders
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = !searchTerm || 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          placeholder="Search tickets..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter || ''} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={onRefresh}>Refresh</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <Card
              key={ticket.id}
              className="overflow-hidden"
            >
              <div 
                className={`p-4 cursor-pointer ${
                  ticket.priority === 'high' ? 'border-l-4 border-l-red-500' :
                  ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                  'border-l-4 border-l-blue-500'
                }`}
                onClick={() => toggleTicketExpanded(ticket.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    {ticket.expanded ? 
                      <ChevronDown className="h-4 w-4 shrink-0" /> : 
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    }
                    <span className="font-medium">{ticket.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      ticket.status === 'open' ? 'outline' :
                      ticket.status === 'in-progress' ? 'secondary' :
                      ticket.status === 'review' ? 'secondary' :
                      ticket.status === 'done' ? 'success' :
                      'default'
                    }>
                      {ticket.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => toggleTicketExpanded(ticket.id, e)}
                      className="h-7 px-2"
                    >
                      {ticket.expanded ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
              </div>
              
              {ticket.expanded && (
                <div className="p-4 pt-0 border-t">
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    {/* ... Rest of the code remains the same ... */}
                    
                    {showTimeTracking && currentUserId && ticket.isTaskTicket && (ticket as any).isProjectTicket && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Time Tracking</h4>
                        <TimeTracker 
                          ticketId={ticket.id} 
                          userId={currentUserId}
                          jobAppId={ticket.job_app_id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

// Add display name for better debugging
TicketDashboard.displayName = 'TicketDashboard';
