
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Ticket, TicketDashboardProps } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Clock, 
  MessageSquare, 
  X, 
  Check, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";
import { TicketAttachments } from "./TicketAttachments"; // Import the TicketAttachments component

export const TicketDashboard = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  userCanEditDates = true,
  userCanEditStatus = true,
  renderTicketActions,
  expandedTickets = new Set<string>(),
  toggleTicketExpansion = () => {}
}: TicketDashboardProps) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets || []);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);
  
  useEffect(() => {
    filterAndSortTickets();
  }, [tickets, filterStatus, filterPriority, searchQuery, sortOption, sortDirection]);
  
  const filterAndSortTickets = () => {
    let filtered = [...tickets];
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) ||
        (ticket.description && ticket.description.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortOption as keyof Ticket];
      const bValue = b[sortOption as keyof Ticket];
      
      // For date fields
      if (sortOption === "created_at" || sortOption === "updated_at" || sortOption === "due_date") {
        const aDate = aValue ? new Date(aValue as string).getTime() : 0;
        const bDate = bValue ? new Date(bValue as string).getTime() : 0;
        
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }
      
      // For string fields
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // For number fields
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setFilteredTickets(filtered);
  };
  
  const toggleSort = (option: string) => {
    if (sortOption === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOption(option);
      setSortDirection("desc");
    }
  };
  
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (onTicketAction) {
      await onTicketAction(ticketId, "updateStatus", newStatus);
    }
  };
  
  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    if (onTicketAction) {
      await onTicketAction(ticketId, "updatePriority", newPriority);
    }
  };
  
  const handleDueDateChange = async (ticketId: string, newDueDate: string) => {
    if (onTicketAction) {
      await onTicketAction(ticketId, "updateDueDate", newDueDate);
    }
  };
  
  const handleAddNote = async (ticketId: string, note: string) => {
    if (onTicketAction) {
      await onTicketAction(ticketId, "addNote", note);
    }
    
    // Clear note input
    setTickets(currentTickets => 
      currentTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, newNote: "" } 
          : ticket
      )
    );
  };
  
  const handleNoteChange = (ticketId: string, note: string) => {
    setTickets(currentTickets => 
      currentTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, newNote: note } 
          : ticket
      )
    );
  };
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case "blocked":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Blocked</Badge>;
      case "review":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Review</Badge>;
      case "done":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Done</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };
  
  const getTicketAssignee = (ticket: Ticket) => {
    return ticket.assigned_to || "Unassigned";
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    
    return date.toLocaleDateString();
  };
  
  if (!tickets || tickets.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">No tickets found.</p>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
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
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
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
        
        <div className="flex gap-2">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto"
          />
          
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Card className="shadow-sm">
        <div className="bg-gray-50 p-3 border-b grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
          <div className="col-span-5 sm:col-span-4 lg:col-span-4 flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("title")}>
            <span>Ticket</span>
            {sortOption === "title" && (
              sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            )}
          </div>
          <div className="hidden lg:flex col-span-2 items-center gap-1 cursor-pointer" onClick={() => toggleSort("created_at")}>
            <span>Created</span>
            {sortOption === "created_at" && (
              sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            )}
          </div>
          <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
            <span>Status</span>
          </div>
          <div className="col-span-3 sm:col-span-2 flex items-center gap-1">
            <span>Priority</span>
          </div>
          <div className="hidden sm:flex col-span-2 items-center gap-1">
            <span>Due Date</span>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-1">
            <span>Actions</span>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="py-3 px-3">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div 
                    className="col-span-5 sm:col-span-4 lg:col-span-4 cursor-pointer"
                    onClick={() => toggleTicketExpansion(ticket.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{ticket.title}</span>
                      <span className="text-xs text-gray-500 truncate">
                        {ticket.description ? ticket.description.substring(0, 40) + (ticket.description.length > 40 ? '...' : '') : 'No description'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block col-span-2 text-sm text-gray-500">
                    {ticket.created_at ? formatDate(ticket.created_at) : "N/A"}
                  </div>
                  
                  <div className="col-span-3 sm:col-span-2">
                    {userCanEditStatus ? (
                      <Select 
                        value={ticket.status} 
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs w-full">
                          <SelectValue placeholder="Status" />
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
                    ) : (
                      renderStatusBadge(ticket.status)
                    )}
                  </div>
                  
                  <div className="col-span-3 sm:col-span-2">
                    <Select 
                      value={ticket.priority} 
                      onValueChange={(value) => handlePriorityChange(ticket.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="hidden sm:block col-span-2">
                    {userCanEditDates ? (
                      <Input 
                        type="date" 
                        className="h-8 text-xs"
                        value={ticket.due_date || ""}
                        onChange={(e) => handleDueDateChange(ticket.id, e.target.value)}
                      />
                    ) : (
                      <span className="text-sm">{ticket.due_date ? formatDate(ticket.due_date) : "No due date"}</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex justify-end gap-1">
                    {/* Ticket Attachments Display */}
                    {(ticket.attachments?.length > 0 || (ticket.project_id && ticket.id)) && (
                      <TicketAttachments 
                        ticketId={ticket.id}
                        projectId={ticket.project_id}
                        attachmentUrls={ticket.attachments}
                      />
                    )}
                    
                    {showTimeTracking && onLogTime && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onLogTime(ticket.id)}
                      >
                        <Clock className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleTicketExpansion(ticket.id)}
                    >
                      {expandedTickets instanceof Set ? 
                        (expandedTickets.has(ticket.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) :
                        (expandedTickets[ticket.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
                      }
                    </Button>
                    
                    {renderTicketActions && renderTicketActions(ticket)}
                  </div>
                </div>
                
                {expandedTickets instanceof Set ? 
                  (expandedTickets.has(ticket.id) && (
                    <ExpandedTicketDetails 
                      ticket={ticket}
                      onTicketAction={onTicketAction}
                      onLogTime={onLogTime}
                      userCanEditStatus={userCanEditStatus}
                      userCanEditDates={userCanEditDates}
                    />
                  )) :
                  (expandedTickets[ticket.id] && (
                    <ExpandedTicketDetails 
                      ticket={ticket}
                      onTicketAction={onTicketAction}
                      onLogTime={onLogTime}
                      userCanEditStatus={userCanEditStatus}
                      userCanEditDates={userCanEditDates}
                    />
                  ))
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
