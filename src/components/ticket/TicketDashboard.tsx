import React, { useState, useEffect } from "react";
import { Ticket } from "@/types/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketItem } from "@/components/ticket/TicketItem";
import { Clock } from "lucide-react";

export interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime?: (ticketId: string, hours?: number, description?: string) => Promise<void>;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  userCanEditDates?: boolean;
  showEstimatedHours?: boolean;
}

export const TicketDashboard = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  renderTicketActions,
  userCanEditDates = true,
  showEstimatedHours = false
}: TicketDashboardProps) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    setTickets(initialTickets);
    setFilteredTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    let results = [...tickets];

    if (searchQuery) {
      results = results.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      results = results.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      results = results.filter(ticket => ticket.priority === priorityFilter);
    }

    setCurrentPage(1);
    setFilteredTickets(results);
  }, [searchQuery, statusFilter, priorityFilter, tickets]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleTicketExpand = (ticketId: string) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handlePriorityFilterChange = (priority: string) => {
    setPriorityFilter(priority);
  };

  const handleLogTime = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsTimeTrackingOpen(true);
  };

  const closeTimeTracking = () => {
    setIsTimeTrackingOpen(false);
    setSelectedTicketId(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="search"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        {currentItems.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-background">
            <p className="text-muted-foreground">No tickets found matching your filters.</p>
          </div>
        ) : (
          currentItems.map((ticket) => (
            <TicketItem 
              key={ticket.id}
              ticket={ticket}
              isExpanded={expandedTickets[ticket.id] || false}
              onToggleExpand={() => toggleTicketExpand(ticket.id)}
              onTicketAction={onTicketAction}
              showTimeTracking={showTimeTracking}
              onLogTime={showTimeTracking ? () => handleLogTime(ticket.id) : undefined}
              customActions={renderTicketActions ? renderTicketActions(ticket) : undefined}
              userCanEditDates={userCanEditDates}
              showEstimatedHours={showEstimatedHours}
            />
          ))
        )}
      </div>
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {isTimeTrackingOpen && selectedTicketId && (
        <div>
          <h2>Time Tracking for Ticket {selectedTicketId}</h2>
          <Button onClick={closeTimeTracking}>Close Time Tracking</Button>
        </div>
      )}
    </div>
  );
};
