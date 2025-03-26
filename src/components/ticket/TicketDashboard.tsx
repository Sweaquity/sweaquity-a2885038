import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Ticket, TicketDashboardProps } from "@/types/types";
import { KanbanBoard } from "./KanbanBoard";
import { TicketTableView } from "./TicketTableView";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { TicketDetails } from "./TicketDetails";
import { TicketDialog } from "./TicketDialog";
import { TimeLogDialog } from "./TimeLogDialog";
import { LayoutGrid, List, RefreshCw } from "lucide-react";

export const TicketDashboard = ({ 
  tickets = [], 
  initialTickets = [],
  onRefresh,
  onTicketAction,
  showTimeTracking = true,
  userId
}: TicketDashboardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const fetchProjects = async () => {
    try {
      // Fetch projects logic here
      const mockProjects = [
        { id: "1", title: "Project A" },
        { id: "2", title: "Project B" },
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      // Create ticket logic here
      console.log("Creating ticket:", ticketData);
      setCreateTicketOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const filteredTickets = React.useMemo(() => {
    let filtered = [...tickets];

    if (filter === "open") {
      filtered = filtered.filter((ticket) => ticket.status !== "done");
    } else if (filter === "closed") {
      filtered = filtered.filter((ticket) => ticket.status === "done");
    } else if (filter === "high") {
      filtered = filtered.filter((ticket) => ticket.priority === "high");
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.project_id === projectFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((ticket) =>
        ticket.title.toLowerCase().includes(lowerQuery) ||
        ticket.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [tickets, filter, projectFilter, searchQuery]);

  const hasProjects = projects && projects.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>Tickets</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => setCreateTicketOpen(true)}
            >
              Create Ticket
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open Tasks</SelectItem>
                <SelectItem value="closed">Closed Tasks</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            
            {hasProjects && (
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Button>
          </div>
        </div>
        
        <div className="flex justify-start mt-4">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No tickets found</p>
            <Button 
              variant="outline" 
              onClick={() => setCreateTicketOpen(true)}
              className="mt-4"
            >
              Create a new ticket
            </Button>
          </div>
        ) : (
          viewMode === 'table' ? (
            <TicketTableView 
              tickets={filteredTickets} 
              onTicketClick={handleTicketClick}
              onTicketAction={onTicketAction}
            />
          ) : (
            <KanbanBoard 
              tickets={filteredTickets} 
              onTicketClick={handleTicketClick}
              onTicketAction={onTicketAction}
            />
          )
        )}
      </CardContent>
      
      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        onCreateTicket={handleCreateTicket}
        projects={projects}
      />
      
      {selectedTicket && (
        <TicketDialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
          <TicketDetails 
            ticket={selectedTicket} 
            onClose={() => setIsTicketDialogOpen(false)}
            onTicketAction={onTicketAction}
          />
        </TicketDialog>
      )}
      
      {selectedTicket && showTimeTracking && (
        <TimeLogDialog
          open={isTimeLogDialogOpen}
          onOpenChange={setIsTimeLogDialogOpen}
          ticket={selectedTicket}
          userId={userId}
        />
      )}
    </Card>
  );
};
