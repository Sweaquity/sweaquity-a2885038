import React, { useState, useEffect } from "react";
import { Ticket } from "@/types/types";
import { TicketItem } from "./TicketItem";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchX, RefreshCw, Filter, Clock } from "lucide-react";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";
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
  userCanEditStatus?: boolean;
  showEstimatedHours?: boolean;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId = '',
  onLogTime,
  renderTicketActions,
  userCanEditDates = true,
  userCanEditStatus = true,
  showEstimatedHours = true
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(5);
  const [expandedTicket, setExpandedTicket] = useState<Ticket | null>(null);
  const [showTimeTrackingDialog, setShowTimeTrackingDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    setTickets(initialTickets);
    setCurrentPage(1);
  }, [initialTickets]);

  const handleExpandTicket = (ticket: Ticket) => {
    setExpandedTicket(ticket);
  };

  const handleLogTimeClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowTimeTrackingDialog(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePriorityFilterChange = (priority: string | null) => {
    setPriorityFilter(priority);
    setCurrentPage(1);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchRegex = new RegExp(searchQuery, "i");
    const matchesSearch = searchRegex.test(ticket.title) || searchRegex.test(ticket.description);

    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const paginatedTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="search"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-md"
        />

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusFilterChange(null)}>
                Clear Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("new")}>
                New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("in-progress")}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("blocked")}>
                Blocked
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("review")}>
                Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("done")}>
                Done
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusFilterChange("closed")}>
                Closed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePriorityFilterChange(null)}>
                Clear Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilterChange("low")}>
                Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilterChange("medium")}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilterChange("high")}>
                High
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {paginatedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SearchX className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No tickets found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term or clear filters" : "Create your first ticket to get started"}
            </p>
          </div>
        ) : (
          paginatedTickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              onExpand={handleExpandTicket}
              onTicketAction={onTicketAction}
              showTimeTracking={showTimeTracking}
              onLogTime={onLogTime}
              renderActions={renderTicketActions ? () => renderTicketActions(ticket) : undefined}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {Array.from({ length: Math.ceil(filteredTickets.length / ticketsPerPage) }, (_, i) => (
          <Button
            key={i + 1}
            variant={currentPage === i + 1 ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === Math.ceil(filteredTickets.length / ticketsPerPage)}
        >
          Next
        </Button>
      </div>

      {expandedTicket && (
        <ExpandedTicketDetails
          ticket={expandedTicket}
          onClose={() => setExpandedTicket(null)}
          onTicketAction={onTicketAction}
          onLogTime={onLogTime ? () => onLogTime(expandedTicket.id) : undefined}
          userCanEditStatus={userCanEditStatus}
          userCanEditDates={userCanEditDates}
        />
      )}

      {showTimeTrackingDialog && selectedTicketId && (
        <TimeTracking
          ticketId={selectedTicketId}
          userId={userId}
          onClose={() => setShowTimeTrackingDialog(false)}
        />
      )}
    </div>
  );
};
