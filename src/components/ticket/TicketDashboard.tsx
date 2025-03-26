
import React, { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Ticket } from "@/types/types";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh: () => void;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  showTimeTracking?: boolean;
  userId: string;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  renderTicketActions
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    let filtered = [...tickets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(term) ||
          (ticket.description && ticket.description.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.ticket_type === typeFilter);
    }

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const displayedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    await onTicketAction(ticketId, "updateStatus", status);
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      )
    );
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    await onTicketAction(ticketId, "updatePriority", priority);
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priority } : ticket
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
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

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 mr-1 text-blue-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 mr-1 text-yellow-500" />;
      case "blocked":
        return <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />;
      case "done":
      case "closed":
        return <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 mr-1 text-gray-500" />;
    }
  };

  const getTicketTypeLabel = (type: string) => {
    switch (type) {
      case "task":
        return "Task";
      case "ticket":
        return "Ticket";
      case "beta-test":
        return "Beta Test";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="beta-test">Beta Test</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {displayedTickets.length === 0 ? (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <h3 className="font-medium text-lg">No tickets found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Type</TableHead>
                  {showTimeTracking && <TableHead>Hours</TableHead>}
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell
                      className="font-medium cursor-pointer hover:text-blue-600"
                      onClick={() => openTicketDetails(ticket)}
                    >
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
                      >
                        <SelectTrigger className={`w-[130px] ${getStatusColor(ticket.status)}`}>
                          <SelectValue>
                            <div className="flex items-center">
                              {getStatusIcon(ticket.status)}
                              <span>
                                {ticket.status === "in-progress"
                                  ? "In Progress"
                                  : ticket.status.charAt(0).toUpperCase() +
                                    ticket.status.slice(1)}
                              </span>
                            </div>
                          </SelectValue>
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
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.priority}
                        onValueChange={(value) => handleUpdatePriority(ticket.id, value)}
                      >
                        <SelectTrigger className={`w-[100px] ${getPriorityColor(ticket.priority)}`}>
                          <SelectValue>
                            {ticket.priority.charAt(0).toUpperCase() +
                              ticket.priority.slice(1)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTicketTypeLabel(ticket.ticket_type || "task")}
                      </Badge>
                    </TableCell>
                    {showTimeTracking && (
                      <TableCell>
                        {ticket.estimated_hours || 0} / {ticket.hours_logged || 0} hrs
                      </TableCell>
                    )}
                    <TableCell>{formatDate(ticket.due_date)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTicketDetails(ticket)}
                        >
                          View
                        </Button>
                        {showTimeTracking && onLogTime && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLogTime(ticket.id)}
                          >
                            Log Time
                          </Button>
                        )}
                        {renderTicketActions && renderTicketActions(ticket)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedTicket && (
            <ExpandedTicketDetails
              ticket={selectedTicket}
              onClose={() => setIsDialogOpen(false)}
              onTicketAction={onTicketAction}
              onLogTime={showTimeTracking && onLogTime ? onLogTime : undefined}
              userCanEditStatus={true}
              userCanEditDates={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
