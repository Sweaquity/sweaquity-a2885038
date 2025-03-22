
import React, { useState, useEffect } from "react";
import { TicketStats } from "@/components/ticket/TicketStats";
import { FilterBar } from "@/components/ticket/FilterBar";
import { TicketTable } from "@/components/ticket/TicketTable";
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
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
  projectFilter, 
  userFilter,
  includeProjectTickets = true
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  
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
      const userFilteredTickets = userFilter 
        ? fetchedTickets.filter(ticket => 
            ticket.assigned_to === userFilter || ticket.reporter === userFilter
          ) 
        : fetchedTickets;
      
      setTickets(userFilteredTickets);
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

      <TicketStats 
        totalTickets={totalTickets}
        openTickets={openTickets}
        closedTickets={closedTickets}
        highPriorityTickets={highPriorityTickets}
      />

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
          {view === 'table' ? (
            <TicketTable 
              tickets={filteredTickets} 
              isLoading={isLoading} 
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <KanbanBoard 
              tickets={filteredTickets}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          )}
        </TabsContent>
        
        <TabsContent value="my-tickets">
          {/* Filter for assigned tickets would go here */}
          {view === 'table' ? (
            <TicketTable 
              tickets={filteredTickets.filter(ticket => ticket.assigned_to === userFilter)} 
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <KanbanBoard 
              tickets={filteredTickets.filter(ticket => ticket.assigned_to === userFilter)}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          )}
        </TabsContent>
        
        <TabsContent value="reported">
          {/* Filter for reported tickets would go here */}
          {view === 'table' ? (
            <TicketTable 
              tickets={filteredTickets.filter(ticket => ticket.reporter === userFilter)} 
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          ) : (
            <KanbanBoard 
              tickets={filteredTickets.filter(ticket => ticket.reporter === userFilter)}
              onStatusChange={handleStatusChange}
              onViewTicket={handleViewTicket}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
