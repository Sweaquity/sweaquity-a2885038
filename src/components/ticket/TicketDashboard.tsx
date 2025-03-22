import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TicketList } from "./TicketList";
import { FilterBar } from "./FilterBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketDetails } from "./TicketDetails";
import { TicketStats } from "./TicketStats";
import { Eye, EyeOff, Plus } from "lucide-react";
import { TicketForm } from "./TicketForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Ticket } from "@/types/types";

interface TicketDashboardProps {
  initialTickets: Ticket[];
  onRefresh?: () => void;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({ 
  initialTickets,
  onRefresh
}) => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortCriteria, setSortCriteria] = useState("newest");
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  
  const ticketStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length,
    closedTickets: tickets.filter(ticket => 
      ticket.status === 'done' || ticket.status === 'closed'
    ).length,
    highPriorityTickets: tickets.filter(ticket => 
      ticket.priority === 'high'
    ).length
  };

  useEffect(() => {
    setTickets(initialTickets);
    filterTickets(activeFilter, initialTickets);
  }, [initialTickets, activeFilter]);

  const filterTickets = (filter: string, ticketsToFilter = tickets) => {
    let filtered = [...ticketsToFilter];
    
    switch (filter) {
      case "all":
        // No filtering needed
        break;
      case "open":
        filtered = filtered.filter(ticket => 
          ticket.status !== 'done' && ticket.status !== 'closed'
        );
        break;
      case "closed":
        filtered = filtered.filter(ticket => 
          ticket.status === 'done' || ticket.status === 'closed'
        );
        break;
      case "high":
        filtered = filtered.filter(ticket => ticket.priority === 'high');
        break;
      default:
        break;
    }
    
    sortTickets(sortCriteria, filtered);
  };

  const sortTickets = (criteria: string, ticketsToSort = filteredTickets) => {
    let sorted = [...ticketsToSort];
    
    switch (criteria) {
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        break;
      case "priority":
        sorted.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        });
        break;
      default:
        break;
    }
    
    setFilteredTickets(sorted);
  };

  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
    filterTickets(newFilter);
  };

  const handleSortChange = (newSort: string) => {
    setSortCriteria(newSort);
    sortTickets(newSort);
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsOpen(true);
  };

  const handleCreateTicket = (newTicket: Partial<Ticket>) => {
    // In a real implementation, this would save to the backend
    // For now, just add to the local state
    const ticket = {
      ...newTicket,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: newTicket.status || 'new',
      priority: newTicket.priority || 'medium',
    } as Ticket;
    
    setTickets([ticket, ...tickets]);
    filterTickets(activeFilter, [ticket, ...tickets]);
    setIsCreateTicketOpen(false);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <FilterBar 
          onFilterChange={handleFilterChange}
          activeFilter={activeFilter}
          onSortChange={handleSortChange}
          sortCriteria={sortCriteria}
        />
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showStats ? "Hide Stats" : "Show Stats"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            {showTimeline ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showTimeline ? "Hide Timeline" : "Show Timeline"}
          </Button>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Refresh
          </Button>
          
          <Button onClick={() => setIsCreateTicketOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>
      
      {showStats && (
        <div className="mb-6">
          <TicketStats
            totalTickets={ticketStats.totalTickets}
            openTickets={ticketStats.openTickets}
            closedTickets={ticketStats.closedTickets}
            highPriorityTickets={ticketStats.highPriorityTickets}
          />
        </div>
      )}
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <TicketList 
            tickets={filteredTickets} 
            onTicketClick={handleTicketClick}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          {showTimeline ? (
            <div className="border rounded-lg p-4">
              {/* Timeline implementation goes here */}
              <div className="text-center p-6 bg-muted/20">
                <p>Timeline view - Include your timeline component here</p>
                <p className="text-sm text-muted-foreground mt-2">This would display tickets on a timeline.</p>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/20 rounded-lg">
              <p>Timeline view is hidden</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Ticket details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[90%] max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <TicketDetails 
              ticket={selectedTicket} 
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create ticket dialog */}
      <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
        <DialogContent className="sm:max-w-[90%]">
          <TicketForm 
            onSubmit={handleCreateTicket} 
            onCancel={() => setIsCreateTicketOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
