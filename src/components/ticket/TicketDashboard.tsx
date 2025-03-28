
import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, MoreHorizontal, RefreshCw, Clock } from "lucide-react";
import { Ticket, TicketDashboardProps } from "@/types/types";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";
import { format } from "date-fns";

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  userId,
  onLogTime,
  showTimeTracking = false,
  userCanEditDates = false,  // Support the date edit ability
  userCanEditStatus = false  // Support status editing
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedTicket, setExpandedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedTickets = () => {
    const filteredTickets = tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return filteredTickets.sort((a, b) => {
      let aValue: any = a[sortField as keyof Ticket];
      let bValue: any = b[sortField as keyof Ticket];
      
      if (sortField === "status") {
        // Custom sort order for status
        const statusOrder: { [key: string]: number } = {
          "critical": 0,
          "high": 1,
          "medium": 2,
          "low": 3
        };
        
        aValue = statusOrder[a.status] ?? 999;
        bValue = statusOrder[b.status] ?? 999;
      }
      
      if (sortField === "due_date") {
        aValue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        bValue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      }
      
      if (sortField === "created_at" || sortField === "updated_at") {
        aValue = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
        bValue = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
      }
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const renderSortArrow = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "todo":
      case "backlog":
        return "bg-gray-100 text-gray-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "review":
      case "in review":
        return "bg-yellow-100 text-yellow-800";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogTime = (ticketId: string) => {
    if (onLogTime) {
      onLogTime(ticketId);
    }
  };

  const handleExpandTicket = (ticket: Ticket) => {
    setExpandedTicket(ticket);
  };

  const handleCloseExpandedTicket = () => {
    setExpandedTicket(null);
  };

  const sortedTickets = getSortedTickets();

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
        <Button variant="outline" onClick={onRefresh} className="shrink-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[300px] cursor-pointer" 
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center">
                  Title {renderSortArrow("title")}
                </div>
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer" 
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status {renderSortArrow("status")}
                </div>
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer" 
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center">
                  Priority {renderSortArrow("priority")}
                </div>
              </TableHead>
              <TableHead 
                className="w-[120px] cursor-pointer" 
                onClick={() => handleSort("due_date")}
              >
                <div className="flex items-center">
                  Due Date {renderSortArrow("due_date")}
                </div>
              </TableHead>
              <TableHead 
                className="w-[100px] cursor-pointer"
                onClick={() => handleSort("completion_percentage")}
              >
                <div className="flex items-center">
                  Progress {renderSortArrow("completion_percentage")}
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center">
                  Hours (Logged/Est.)
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              sortedTickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-gray-50">
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleExpandTicket(ticket)}
                  >
                    {ticket.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(ticket.due_date)}</TableCell>
                  <TableCell>
                    {typeof ticket.completion_percentage === 'number' ? (
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${ticket.completion_percentage}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs">{ticket.completion_percentage}%</span>
                      </div>
                    ) : (
                      <span>N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.hours_logged || 0} / {ticket.estimated_hours || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      {showTimeTracking && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLogTime(ticket.id)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExpandTicket(ticket)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {expandedTicket && (
        <ExpandedTicketDetails
          ticket={expandedTicket}
          onClose={handleCloseExpandedTicket}
          onTicketAction={onTicketAction}
          onLogTime={showTimeTracking ? handleLogTime : undefined}
          userCanEditStatus={userCanEditStatus}
          userCanEditDates={userCanEditDates}
        />
      )}
    </div>
  );
};
