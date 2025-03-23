
import React, { useState, useEffect, useCallback } from "react";
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

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketExpand?: (ticketId: string, isExpanded: boolean) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => void;
  showTimeTracking?: boolean;
  currentUserId?: string;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
  initialTickets, 
  onRefresh,
  onTicketExpand,
  onTicketAction,
  showTimeTracking = false,
  currentUserId
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Initialize tickets with their expanded state from initialTickets
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const toggleTicketExpanded = useCallback((ticketId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setTickets(prevTickets => {
      const newTickets = prevTickets.map(ticket => {
        if (ticket.id === ticketId) {
          const newExpandedState = !ticket.expanded;
          
          // Call the callback if provided
          if (onTicketExpand) {
            onTicketExpand(ticketId, newExpandedState);
          }
          
          return {
            ...ticket,
            expanded: newExpandedState
          };
        }
        return ticket;
      });
      return newTickets;
    });
  }, [onTicketExpand]);

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

  const filteredTickets = tickets.filter(ticket => {
    // Apply filters
    const matchesSearch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
          <Select value={statusFilter || ''} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
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
              <SelectItem value="">All priorities</SelectItem>
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
                    <div>
                      <h4 className="text-sm font-medium mb-2">Details</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Status</label>
                          <Select 
                            value={ticket.status} 
                            onValueChange={(value) => handleStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground">Priority</label>
                          <Select 
                            value={ticket.priority} 
                            onValueChange={(value) => handlePriorityChange(ticket.id, value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground">Due Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal mt-1",
                                  !ticket.due_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {ticket.due_date ? format(new Date(ticket.due_date), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={ticket.due_date ? new Date(ticket.due_date) : undefined}
                                onSelect={(date) => date && handleDueDateChange(ticket.id, date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        {ticket.isTaskTicket && (
                          <div>
                            <label className="text-sm text-muted-foreground">Completion Percentage</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={ticket.completion_percentage || 0}
                                onChange={(e) => handleCompletionChange(ticket.id, parseInt(e.target.value))}
                                className="w-24"
                              />
                              <span>%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm whitespace-pre-line">
                        {ticket.description || "No description provided."}
                      </p>
                      
                      {ticket.task_id && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Task Details</h4>
                          <div className="text-sm">
                            {ticket.isTaskTicket ? (
                              <div className="space-y-1">
                                <p><strong>Task ID:</strong> {ticket.task_id}</p>
                                {ticket.equity_points !== undefined && (
                                  <p><strong>Equity Points:</strong> {ticket.equity_points}%</p>
                                )}
                              </div>
                            ) : (
                              <p>This is a regular ticket (not linked to a task).</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Add Note</h4>
                        </div>
                        <div className="flex space-x-2 mt-1">
                          <Textarea 
                            placeholder="Add a note..." 
                            value={ticket.newNote || ''}
                            onChange={(e) => {
                              setTickets(prev => 
                                prev.map(t => t.id === ticket.id ? { ...t, newNote: e.target.value } : t)
                              );
                            }}
                            className="min-h-[60px]"
                          />
                          <Button 
                            onClick={() => {
                              handleAddNote(ticket.id, ticket.newNote || '');
                              setTickets(prev => 
                                prev.map(t => t.id === ticket.id ? { ...t, newNote: '' } : t)
                              );
                            }}
                            disabled={!ticket.newNote}
                            className="shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      {ticket.notes && ticket.notes.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Notes</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {ticket.notes.map((note, index) => (
                              <div key={index} className="text-xs border rounded p-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">{note.user}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(note.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-1 whitespace-pre-line">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
