
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TicketItem } from "./TicketItem";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket } from "@/types/types";
import { TimeTracking } from "./TimeTracking";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId?: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  userCanEditDates?: boolean;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId = "",
  onLogTime,
  renderTicketActions,
  userCanEditDates = false
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false);
  
  const itemsPerPage = 10;

  useEffect(() => {
    setTickets(initialTickets);
    applyFilters(initialTickets, searchTerm, statusFilter, priorityFilter);
  }, [initialTickets]);

  const applyFilters = (
    ticketsToFilter: Ticket[],
    search: string,
    status: string,
    priority: string
  ) => {
    let result = [...ticketsToFilter];

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(lowerSearch) ||
          (ticket.description && ticket.description.toLowerCase().includes(lowerSearch))
      );
    }

    // Status filter
    if (status !== "all") {
      result = result.filter((ticket) => ticket.status === status);
    }

    // Priority filter
    if (priority !== "all") {
      result = result.filter((ticket) => ticket.priority === priority);
    }

    setFilteredTickets(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(tickets, value, statusFilter, priorityFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(tickets, searchTerm, value, priorityFilter);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    applyFilters(tickets, searchTerm, statusFilter, value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLogTime = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsTimeTrackingOpen(true);
  };

  const handleTimeLogged = () => {
    // Refresh ticket data after logging time
    if (onRefresh) {
      onRefresh();
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {paginatedTickets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-muted-foreground">No tickets found matching your filters.</p>
          </div>
        ) : (
          paginatedTickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              onTicketAction={onTicketAction}
              onLogTime={showTimeTracking ? handleLogTime : undefined}
              renderTicketActions={renderTicketActions}
            />
          ))
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="mx-4 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </Pagination>
        </div>
      )}
      
      {showTimeTracking && selectedTicketId && (
        <TimeTracking
          ticketId={selectedTicketId}
          userId={userId}
          open={isTimeTrackingOpen}
          onClose={() => setIsTimeTrackingOpen(false)}
          onTimeLogged={handleTimeLogged}
        />
      )}
    </div>
  );
};
