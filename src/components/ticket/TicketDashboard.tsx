
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TicketList } from "./TicketList";
import { FilterBar } from "./FilterBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketDetails from "./TicketDetails";
import TicketStats from "./TicketStats";
import { Eye, EyeOff, Plus } from "lucide-react";
import { TicketForm } from "./TicketForm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Ticket } from "@/types/types";
import { TicketService } from "./TicketService";

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

  const handleCreateTicket = async (newTicket: any) => {
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

    return Promise.resolve();
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 w-full md:w-auto">
          <h2 className="text-xl font-bold">Tickets</h2>
          <div className="flex space-x-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === "open" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("open")}
            >
              Open
            </Button>
            <Button 
              variant={activeFilter === "closed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("closed")}
            >
              Closed
            </Button>
            <Button 
              variant={activeFilter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("high")}
            >
              High Priority
            </Button>
          </div>
        </div>
        
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
          <div className="border rounded-lg">
            <div className="p-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center p-6">
                  <p>No tickets found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{ticket.title}</h3>
                        <div className={`
                          px-2 py-1 text-xs rounded-full
                          ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}
                        `}>
                          {ticket.priority}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                      <div className="flex justify-between mt-2">
                        <div className={`
                          px-2 py-1 text-xs rounded-full
                          ${ticket.status === 'done' || ticket.status === 'closed' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {ticket.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.due_date && `Due: ${new Date(ticket.due_date).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          {showTimeline ? (
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                  <div className="text-center p-6">
                    <p>No tickets found for the timeline view.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets
                      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                      .map((ticket, index) => (
                        <div 
                          key={ticket.id}
                          className="border-l-2 border-gray-200 pl-4 ml-4 relative cursor-pointer hover:bg-gray-50 p-3 rounded"
                          onClick={() => handleTicketClick(ticket)}
                        >
                          <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-2"></div>
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(ticket.created_at || '').toLocaleString()}
                          </div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{ticket.title}</h4>
                            <Badge variant="outline" className={
                              ticket.status === 'done' || ticket.status === 'closed' 
                                ? 'bg-green-100 text-green-800' 
                                : ticket.status === 'in-progress' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                      ))
                    }
                  </div>
                )}
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
          <DialogTitle>Ticket Details</DialogTitle>
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
          <DialogTitle>Create New Ticket</DialogTitle>
          <TicketForm 
            onSubmit={handleCreateTicket}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDashboard;
