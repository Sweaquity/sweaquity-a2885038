
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Edit, 
  Plus, 
  AlertCircle, 
  Search,
  FileImage,
  Trash
} from "lucide-react";
import { Ticket, TicketDashboardProps } from "@/types/types";
import { ExpandedTicketDetails } from "./ExpandedTicketDetails";
import { toast } from "sonner";
import { checkTicketAttachments } from "../dashboard/TicketAttachmentsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  initialTickets,
  onRefresh,
  onTicketAction,
  showTimeTracking = false,
  userId,
  onLogTime,
  userCanEditDates = false,
  userCanEditStatus = false,
  renderTicketActions,
  expandedTickets = new Set<string>(),
  toggleTicketExpansion
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [ticketsWithAttachments, setTicketsWithAttachments] = useState<Record<string, boolean>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (initialTickets) {
      setTickets(initialTickets);
    }
  }, [initialTickets]);

  useEffect(() => {
    applyFilters();
  }, [tickets, filterStatus, searchQuery]);

  useEffect(() => {
    // Check for attachments for each ticket
    const checkAttachments = async () => {
      const attachmentChecks = await Promise.all(
        tickets.map(async (ticket) => {
          // Check if ticket has attachments property
          const hasAttachmentsArray = ticket.attachments && ticket.attachments.length > 0;
          
          // Also check storage for attachments
          const hasStorageAttachments = await checkTicketAttachments(ticket.reporter, ticket.id);
          
          return { 
            id: ticket.id, 
            hasAttachments: hasAttachmentsArray || hasStorageAttachments 
          };
        })
      );
      
      const result = attachmentChecks.reduce((acc, { id, hasAttachments }) => {
        acc[id] = hasAttachments;
        return acc;
      }, {} as Record<string, boolean>);
      
      setTicketsWithAttachments(result);
    };
    
    checkAttachments();
  }, [tickets]);
  
  const applyFilters = () => {
    let filtered = [...tickets];
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) || 
        (ticket.description && ticket.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTickets(filtered);
  };

  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
  };

  const handleOpenTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketDetailOpen(true);
  };

  const handleCloseTicketDetail = () => {
    setTicketDetailOpen(false);
    setSelectedTicket(null);
  };

  const handleToggleTicket = (ticketId: string) => {
    if (toggleTicketExpansion) {
      toggleTicketExpansion(ticketId);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      if (onTicketAction) {
        await onTicketAction(ticketId, 'deleteTicket', null);
        setTickets(tickets.filter(t => t.id !== ticketId));
        toast.success("Ticket deleted successfully");
      }
      setConfirmDeleteOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const confirmDelete = (ticketId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setTicketToDelete(ticketId);
    setConfirmDeleteOpen(true);
  };
  
  const getTicketStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getTicketPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getTicketHealthColor = (health: string) => {
    switch (health) {
      case "needs-review":
        return "bg-red-100 text-red-800";
      case "needs-help":
        return "bg-yellow-100 text-yellow-800";
      case "good":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => handleStatusFilter("all")}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filterStatus === "new" ? "default" : "outline"}
          onClick={() => handleStatusFilter("new")}
          size="sm"
        >
          New
        </Button>
        <Button
          variant={filterStatus === "in-progress" ? "default" : "outline"}
          onClick={() => handleStatusFilter("in-progress")}
          size="sm"
        >
          In Progress
        </Button>
        <Button
          variant={filterStatus === "blocked" ? "default" : "outline"}
          onClick={() => handleStatusFilter("blocked")}
          size="sm"
        >
          Blocked
        </Button>
        <Button
          variant={filterStatus === "review" ? "default" : "outline"}
          onClick={() => handleStatusFilter("review")}
          size="sm"
        >
          Review
        </Button>
        <Button
          variant={filterStatus === "done" ? "default" : "outline"}
          onClick={() => handleStatusFilter("done")}
          size="sm"
        >
          Done
        </Button>
      </div>

      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-2">No tickets match your filter criteria.</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => {
            const isExpanded = expandedTickets && 
              (expandedTickets instanceof Set 
                ? expandedTickets.has(ticket.id) 
                : expandedTickets[ticket.id]);
            
            return (
              <Card key={ticket.id} className="transition-all duration-200">
                <div 
                  className="p-4 cursor-pointer flex justify-between items-start"
                  onClick={() => handleToggleTicket(ticket.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{ticket.title}</h3>
                      {ticketsWithAttachments[ticket.id] && (
                        <FileImage className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getTicketStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge variant="outline" className={getTicketPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.health && (
                        <Badge variant="outline" className={getTicketHealthColor(ticket.health)}>
                          {ticket.health}
                        </Badge>
                      )}
                      {ticket.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(ticket.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTicketDetail(ticket);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => confirmDelete(ticket.id, e)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {ticket.description || "No description provided."}
                        </p>
                      </div>
                      
                      {ticket.notes && ticket.notes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Notes</h4>
                          <div className="space-y-2">
                            {ticket.notes.slice(0, 2).map((note: any, index: number) => (
                              <div key={index} className="text-sm border-l-2 border-muted pl-2">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span>{note.user}</span>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(note.timestamp).toLocaleString()}</span>
                                </div>
                                <p>{note.comment}</p>
                              </div>
                            ))}
                            {ticket.notes.length > 2 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="pl-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTicketDetail(ticket);
                                }}
                              >
                                View all {ticket.notes.length} notes
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicketDetail(ticket);
                          }}
                        >
                          View Detailed
                        </Button>
                        
                        {showTimeTracking && onLogTime && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogTime(ticket.id);
                            }}
                          >
                            <Clock className="mr-1 h-4 w-4" />
                            Log Time
                          </Button>
                        )}
                        
                        {renderTicketActions && renderTicketActions(ticket)}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Ticket details modal */}
      {selectedTicket && ticketDetailOpen && (
        <ExpandedTicketDetails 
          ticket={selectedTicket}
          onClose={handleCloseTicketDetail}
          onTicketAction={onTicketAction}
          onLogTime={onLogTime}
          userCanEditStatus={userCanEditStatus}
          userCanEditDates={userCanEditDates}
        />
      )}
      
      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDeleteOpen(false);
                setTicketToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => ticketToDelete && handleDeleteTicket(ticketToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
