import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Ticket } from "@/types/types";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  isBusinessMode?: boolean;
  userId: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
  userCanEditStatus?: boolean; // Default to false for safety
  userCanEditDates?: boolean // Default to false for safety
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = true,
  isBusinessMode = false,
  userId,
  onLogTime,
  renderTicketActions,
  userCanEditStatus = false, // Default to false for safety
  userCanEditDates = false // Default to false for safety
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTicket, setExpandedTicket] = useState<Ticket | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(5);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const handleTicketAction = async (ticketId: string, action: string, data: any): Promise<void> => {
    if (onTicketAction) {
      await onTicketAction(ticketId, action, data);
      
      if (expandedTicket && expandedTicket.id === ticketId) {
        // If the expanded ticket was modified, refresh its data
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setExpandedTicket(updatedTicket);
        }
      }
    }
  };

  const handleExpandTicket = (ticket: Ticket) => {
    setExpandedTicket(ticket);
  };

  const handleLogTime = (ticketId: string) => {
    if (onLogTime) {
      onLogTime(ticketId);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredTickets.length / ticketsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="search">Search Tickets:</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-md"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh Data
        </Button>
      </div>
      
      <div className="rounded-md border">
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            {showTimeTracking && <TableHead>Time Logged</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <Table>
          
          
          <TableBody>
            {currentTickets.map((ticket) => (
              <React.Fragment key={ticket.id}>
                <TableRow
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    expandedTicket && expandedTicket.id === ticket.id && "bg-muted/50"
                  )}
                  onClick={() => handleExpandTicket(ticket)}
                >
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>{ticket.status}</TableCell>
                  <TableCell>{ticket.priority}</TableCell>
                  <TableCell>{ticket.due_date || "Not set"}</TableCell>
                  {showTimeTracking && <TableCell>{ticket.hours_logged || 0} hrs</TableCell>}
                  <TableCell className="text-right">
                    {renderTicketActions && renderTicketActions(ticket)}
                  </TableCell>
                </TableRow>
                
                {expandedTicket && expandedTicket.id === ticket.id && (
                  <TableRow>
                    <TableCell colSpan={showTimeTracking ? 6 : 5} className="p-0">
                      <div className="p-4">
                        <ExpandedTicketDetails
                          ticket={expandedTicket}
                          onClose={() => setExpandedTicket(null)}
                          onTicketAction={handleTicketAction}
                          onLogTime={showTimeTracking ? handleLogTime : undefined}
                          userCanEditStatus={userCanEditStatus}
                          userCanEditDates={userCanEditDates}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstTicket + 1} - {Math.min(indexOfLastTicket, filteredTickets.length)} of {filteredTickets.length} tickets
        </div>
        <div className="space-x-2">
          {pageNumbers.map(number => (
            <Button
              key={number}
              variant="outline"
              size="sm"
              onClick={() => paginate(number)}
              disabled={currentPage === number}
            >
              {number}
            </Button>
          ))}
        </div>
      </div>
      
    </div>
  );
};
