
import React, { useState, useCallback, useEffect } from "react";
import { Ticket } from "@/types/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Clock, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressCircle } from "@/components/ui/progress-circle";

interface FilterBarProps {
  onFilterChange: (status: string | null, priority: string | null) => void;
  onRefresh?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value === "all" ? null : e.target.value;
    setStatusFilter(newStatus);
    onFilterChange(newStatus, priorityFilter);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value === "all" ? null : e.target.value;
    setPriorityFilter(newPriority);
    onFilterChange(statusFilter, newPriority);
  };

  return (
    <Card className="bg-secondary/30">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={handleStatusChange}
              defaultValue="all"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
              Priority:
            </label>
            <select
              id="priority-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={handlePriorityChange}
              defaultValue="all"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>
    </Card>
  );
};

interface TicketCardProps {
  ticket: Ticket;
  onExpand: (isExpanded: boolean) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onDueDateChange: (dueDate: string) => void;
  onAddNote: (note: string) => void;
  formatDate: (dateString: string) => string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onExpand,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAddNote,
  formatDate
}) => {
  const safeStatus = ticket.status || "new";
  const safePriority = ticket.priority || "medium";
  const [noteText, setNoteText] = useState('');
  const equity = ticket.equity_points || 0;
  const completion = ticket.completion_percentage || 0;

  // Calculate earned equity based on completion percentage
  const earnedEquity = equity * (completion / 100);
  const formattedEarnedEquity = earnedEquity.toFixed(2);
  
  return (
    <Card className="shadow-md">
      <div className="flex items-start justify-between p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{ticket.title}</h3>
          <p className="text-sm text-gray-500">{ticket.description}</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">{safeStatus}</Badge>
            <Badge>{safePriority}</Badge>
            {ticket.due_date && (
              <div className="flex items-center text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-xs">{formatDate(ticket.due_date)}</span>
              </div>
            )}
            {ticket.completion_percentage !== undefined && (
              <div className="flex items-center gap-1">
                <ProgressCircle 
                  value={ticket.completion_percentage}
                  size="sm"
                  strokeWidth={3}
                />
                <span className="text-xs">{ticket.completion_percentage}%</span>
              </div>
            )}
            {ticket.hours_logged !== undefined && (
              <div className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-xs">{ticket.hours_logged} hrs</span>
              </div>
            )}
            {equity > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {equity}% equity
              </Badge>
            )}
            {equity > 0 && completion > 0 && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {formattedEarnedEquity}% earned
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onExpand(!ticket.expanded)}>
          {ticket.expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {ticket.expanded && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-semibold mb-2">Description</h4>
              <div className="bg-slate-50 rounded p-3 text-sm whitespace-pre-wrap">
                {ticket.description || "No description provided."}
              </div>
              
              {ticket.completion_percentage !== undefined && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Completion</h4>
                  <div className="flex items-center gap-3">
                    <ProgressCircle 
                      value={ticket.completion_percentage}
                      size="md"
                      strokeWidth={4}
                    />
                    <div>
                      <p className="font-medium">{ticket.completion_percentage}% Complete</p>
                      {ticket.equity_points && (
                        <p className="text-sm text-green-700">
                          Earning {formattedEarnedEquity}% of {ticket.equity_points}% equity
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {ticket.hours_logged !== undefined && ticket.estimated_hours && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Time Tracking</h4>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-medium">{ticket.hours_logged} of {ticket.estimated_hours} hours logged</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (ticket.hours_logged / ticket.estimated_hours) * 100)}%` }}
                        ></div>
                      </div>
                      {ticket.equity_points && (
                        <p className="text-sm text-green-700 mt-1">
                          Earning {((ticket.hours_logged / ticket.estimated_hours) * ticket.equity_points).toFixed(2)}% of {ticket.equity_points}% equity
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-md font-semibold mb-2">Update Details</h4>
              <div className="space-y-2">
                <div>
                  <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <Select
                    value={safeStatus}
                    onValueChange={onStatusChange}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="priority-select" className="block text-sm font-medium text-gray-700">
                    Priority:
                  </label>
                  <Select
                    value={safePriority}
                    onValueChange={onPriorityChange}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">
                    Due Date:
                  </label>
                  <input
                    type="date"
                    id="due-date"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={(e) => onDueDateChange(e.target.value)}
                    value={ticket.due_date || ''}
                  />
                </div>
              </div>
              
              <h4 className="text-md font-semibold mb-2 mt-4">Add Note</h4>
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="text-sm"
                />
                <Button variant="outline" size="sm" onClick={() => {
                  onAddNote(noteText);
                  setNoteText('');
                }}>
                  Add Note
                </Button>
              </div>
              
              {ticket.notes && Array.isArray(ticket.notes) && ticket.notes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold mb-2">Notes History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {ticket.notes.map((note: any, index: number) => (
                      <div key={note.id || index} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold">{note.user || 'User'}</span>
                          <span className="text-gray-500">
                            {new Date(note.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{note.comment || note.content || ''}</p>
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
  );
};

export interface TicketDashboardProps {
  initialTickets?: Ticket[];
  onRefresh?: () => void;
  onTicketExpand?: (ticketId: string, isExpanded: boolean) => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => void;
  showTimeTracking?: boolean;
  currentUserId?: string;
  expandedTickets?: Record<string, boolean>;
  timeEntries?: any[];
  logTimeForm?: {
    hours: number;
    description: string;
    ticketId: string;
  };
  onLogTimeChange?: (field: string, value: any) => void;
  onLogTime?: () => void;
  userId?: string;
  onToggleTicket?: (ticketId: string, isExpanded: boolean) => void;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets = [],
  onRefresh,
  onTicketExpand,
  onTicketAction,
  showTimeTracking = false,
  currentUserId,
  expandedTickets = {},
  timeEntries = [],
  logTimeForm = { hours: 0, description: "", ticketId: "" },
  onLogTimeChange,
  onLogTime,
  userId,
  onToggleTicket
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [displayedTickets, setDisplayedTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (initialTickets && Array.isArray(initialTickets)) {
      setTickets(initialTickets);
      setFilteredTickets(initialTickets);
      setDisplayedTickets(initialTickets);
    } else {
      setTickets([]);
      setFilteredTickets([]);
      setDisplayedTickets([]);
    }
  }, [initialTickets]);

  const handleFilterChange = useCallback(
    (status: string | null, priority: string | null) => {
      let filtered = tickets;

      if (status) {
        filtered = filtered.filter((ticket) => ticket.status === status);
      }

      if (priority) {
        filtered = filtered.filter((ticket) => ticket.priority === priority);
      }

      setFilteredTickets(filtered);
      setDisplayedTickets(filtered);
    },
    [tickets]
  );

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleToggleTicket = (ticketId: string, isExpanded: boolean) => {
    if (onToggleTicket) {
      onToggleTicket(ticketId, isExpanded);
    } else if (onTicketExpand) {
      onTicketExpand(ticketId, isExpanded);
    } else {
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
        )
      );
      setFilteredTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
        )
      );
      setDisplayedTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
        )
      );
    }
  };

  const handleTicketAction = (ticketId: string, action: string, data: any) => {
    if (onTicketAction) {
      onTicketAction(ticketId, action, data);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString || 'Invalid date';
    }
  };

  return (
    <div className="mt-4">
      <FilterBar 
        onFilterChange={handleFilterChange} 
        onRefresh={handleRefresh}
      />
      
      <div className="space-y-4 mt-4">
        {!displayedTickets || displayedTickets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">No tickets found that match your filter criteria.</p>
          </div>
        ) : (
          displayedTickets.map((ticket) => (
            <div key={ticket.id} className="mb-4">
              <TicketCard
                ticket={ticket}
                onExpand={(isExpanded) => handleToggleTicket(ticket.id, isExpanded)}
                onStatusChange={(status) => handleTicketAction(ticket.id, 'updateStatus', status)}
                onPriorityChange={(priority) => handleTicketAction(ticket.id, 'updatePriority', priority)}
                onDueDateChange={(dueDate) => handleTicketAction(ticket.id, 'updateDueDate', dueDate)}
                onAddNote={(note) => handleTicketAction(ticket.id, 'addNote', note)}
                formatDate={formatDate}
              />
              
              {ticket.expanded && showTimeTracking && userId && 
                ticket.task_id && ticket.project_id && (
                <div className="mt-2 border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Time Tracking</h3>
                  <TimeTracker 
                    ticketId={ticket.id} 
                    userId={userId} 
                    jobAppId={ticket.job_app_id}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
