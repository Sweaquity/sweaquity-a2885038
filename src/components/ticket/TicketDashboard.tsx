import React, { useState, useCallback } from "react";
import { Ticket } from "@/types/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";

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

  return (
    <Card className="shadow-md">
      <div className="flex items-start justify-between p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{ticket.title}</h3>
          <p className="text-sm text-gray-500">{ticket.description}</p>
          <div className="flex space-x-2">
            <Badge variant="secondary">{safeStatus}</Badge>
            <Badge>{safePriority}</Badge>
            {ticket.due_date && (
              <div className="flex items-center text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-xs">{formatDate(ticket.due_date)}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onExpand(!ticket.expanded)}>
          {ticket.expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {ticket.expanded && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-semibold mb-2">Update Details</h4>
              <div className="space-y-2">
                <div>
                  <label htmlFor="status-select" className="block text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <select
                    id="status-select"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={(e) => onStatusChange(e.target.value)}
                    value={safeStatus}
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority-select" className="block text-sm font-medium text-gray-700">
                    Priority:
                  </label>
                  <select
                    id="priority-select"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    onChange={(e) => onPriorityChange(e.target.value)}
                    value={safePriority}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
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
            </div>

            <div>
              <h4 className="text-md font-semibold mb-2">Add Note</h4>
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
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh?: () => void;
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
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);

  const handleFilterChange = useCallback(
    (status: string | null, priority: string | null) => {
      let filtered = initialTickets;

      if (status) {
        filtered = filtered.filter((ticket) => ticket.status === status);
      }

      if (priority) {
        filtered = filtered.filter((ticket) => ticket.priority === priority);
      }

      setFilteredTickets(filtered);
    },
    [initialTickets]
  );

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleToggleTicket = (ticketId: string, isExpanded: boolean) => {
    if (onTicketExpand) {
      onTicketExpand(ticketId, isExpanded);
    }
  };

  const handleTicketAction = (ticketId: string, action: string, data: any) => {
    if (onTicketAction) {
      onTicketAction(ticketId, action, data);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mt-4">
      <FilterBar 
        onFilterChange={handleFilterChange} 
        onRefresh={handleRefresh}
      />
      
      <div className="space-y-4 mt-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">No tickets match your filters.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
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
              
              {ticket.expanded && showTimeTracking && currentUserId && ticket.isTaskTicket && ticket.isProjectTicket && (
                <div className="mt-2 border rounded-md p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Time Tracking</h3>
                  <TimeTracker 
                    ticketId={ticket.id} 
                    userId={currentUserId} 
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
