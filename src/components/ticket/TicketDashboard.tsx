
import React, { useState, useEffect } from "react";
import { FilterBar } from "@/components/ticket/FilterBar";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { fetchTickets, updateTicketStatus } from "./TicketService";
import { Ticket } from "@/types/types";

interface TicketDashboardProps {
  projectFilter?: string;
  userFilter?: string;
  includeProjectTickets?: boolean;
  onRefresh?: () => Promise<void>;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
  projectFilter, 
  userFilter,
  includeProjectTickets = true,
  onRefresh
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('kanban');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, [projectFilter, userFilter]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, priorityFilter, dueDateFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const fetchedTickets = await fetchTickets(projectFilter);
      
      // Apply user filtering if provided
      const userFilteredTickets = userFilter && fetchedTickets 
        ? fetchedTickets.filter(ticket => 
            ticket.assignee === userFilter || ticket.reporter === userFilter
          ) 
        : fetchedTickets;
      
      setTickets(userFilteredTickets || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...tickets];
    
    if (statusFilter) {
      result = result.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter) {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }
    
    if (dueDateFilter) {
      result = result.filter(ticket => {
        if (!ticket.due_date) return false;
        const dueDate = new Date(ticket.due_date).toISOString().split('T')[0];
        return dueDate === dueDateFilter;
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.title?.toLowerCase().includes(query) || 
        ticket.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredTickets(result);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: newStatus } 
            : ticket
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}`,
      });
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setDueDateFilter("");
    setSearchQuery("");
  };

  // Statistics calculations
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed').length;
  const closedTickets = tickets.filter(ticket => ticket.status === 'done' || ticket.status === 'closed').length;
  const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;

  const handleViewTicket = (ticketId: string) => {
    // Implement ticket view functionality
    console.log("View ticket:", ticketId);
    // This would typically navigate to a ticket detail page or open a modal
  };

  const TicketStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground">Total Tickets</div>
        <div className="text-2xl font-bold">{totalTickets}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground">Open Tickets</div>
        <div className="text-2xl font-bold">{openTickets}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground">Closed Tickets</div>
        <div className="text-2xl font-bold">{closedTickets}</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-muted-foreground">High Priority</div>
        <div className="text-2xl font-bold">{highPriorityTickets}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tickets Dashboard</h1>
        <div className="space-x-2">
          <Button 
            variant={view === 'table' ? "default" : "outline"} 
            onClick={() => setView('table')}
            size="sm"
          >
            Table View
          </Button>
          <Button 
            variant={view === 'kanban' ? "default" : "outline"}
            onClick={() => setView('kanban')}
            size="sm"
          >
            Kanban Board
          </Button>
          <Button 
            variant="outline" 
            onClick={loadTickets}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      <TicketStats />

      <FilterBar 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        dueDateFilter={dueDateFilter}
        setDueDateFilter={setDueDateFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="reported">Reported by Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {view === 'kanban' ? (
            <KanbanBoard 
              tickets={filteredTickets}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <div className="p-4 bg-muted rounded-md text-center">
              Table view not implemented
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-tickets">
          {view === 'kanban' ? (
            <KanbanBoard 
              tickets={filteredTickets.filter(ticket => ticket.assignee === userFilter)}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <div className="p-4 bg-muted rounded-md text-center">
              Table view not implemented
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reported">
          {view === 'kanban' ? (
            <KanbanBoard 
              tickets={filteredTickets.filter(ticket => ticket.reporter === userFilter)}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <div className="p-4 bg-muted rounded-md text-center">
              Table view not implemented
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
