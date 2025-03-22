
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import { TicketForm } from "./TicketForm";
import { TicketList } from "./TicketList";
import { TicketKanbanBoard } from "./TicketKanbanBoard";
import { FilterBar } from "./FilterBar";
import TicketStats from "./TicketStats";
import { fetchTickets } from "./TicketService";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Ticket } from "@/types/types";

interface TicketDashboardProps {
  projectId?: string;
  userId?: string;
  onTicketClick?: (ticket: Ticket) => void;
  viewOnly?: boolean;
  defaultView?: "list" | "kanban";
  showCreateButton?: boolean;
  tickets?: Ticket[];
  onRefresh?: () => Promise<void>;
}

export const TicketDashboard: React.FC<TicketDashboardProps> = ({
  projectId,
  userId,
  onTicketClick,
  viewOnly = false,
  defaultView = "list",
  showCreateButton = true
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [view, setView] = useState<"list" | "kanban">(defaultView);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Stats
  const [totalTickets, setTotalTickets] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [closedTickets, setClosedTickets] = useState(0);
  const [highPriorityTickets, setHighPriorityTickets] = useState(0);

  useEffect(() => {
    loadTickets();
  }, [projectId]);

  useEffect(() => {
    filterTickets();
  }, [tickets, statusFilter, priorityFilter, dueDateFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      let ticketsData: Ticket[] = [];
      
      if (projectId) {
        // If projectId is provided, fetch tickets for that project
        ticketsData = await fetchTickets(projectId);
      } else {
        // Otherwise, fetch all tickets or user-specific tickets
        let query = supabase.from('tickets').select('*');
        
        if (userId) {
          query = query.eq('assigned_to', userId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        ticketsData = data.map((ticket: any) => ({
          ...ticket,
          expanded: false,
          newNote: ''
        }));
      }
      
      setTickets(ticketsData);
      calculateStats(ticketsData);
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError("Failed to load tickets");
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ticketsData: Ticket[]) => {
    setTotalTickets(ticketsData.length);
    setOpenTickets(ticketsData.filter(t => t.status !== 'closed' && t.status !== 'done').length);
    setClosedTickets(ticketsData.filter(t => t.status === 'closed' || t.status === 'done').length);
    setHighPriorityTickets(ticketsData.filter(t => t.priority === 'high').length);
  };

  const filterTickets = () => {
    let filtered = [...tickets];
    
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    if (dueDateFilter) {
      filtered = filtered.filter(ticket => {
        if (!ticket.due_date) return false;
        return new Date(ticket.due_date).toISOString().split('T')[0] === dueDateFilter;
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) || 
        (ticket.description && ticket.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTickets(filtered);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setDueDateFilter("");
    setSearchQuery("");
  };

  const handleCreateTicket = async (newTicket: any) => {
    try {
      // Set project_id if provided
      if (projectId) {
        newTicket.project_id = projectId;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a ticket");
        return;
      }
      
      // Set reporter to current user
      newTicket.reporter = user.id;
      
      // Add new ticket to database
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Add expanded and newNote properties
      const newTicketWithProps = {
        ...ticketData,
        expanded: false,
        newNote: ''
      };
      
      // Update tickets state
      const updatedTickets = [newTicketWithProps, ...tickets];
      setTickets(updatedTickets);
      calculateStats(updatedTickets);
      
      toast.success("Ticket created successfully");
      setIsTicketFormOpen(false);
    } catch (err) {
      console.error("Error creating ticket:", err);
      toast.error("Failed to create ticket");
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Functions to update ticket status, priority, due date
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      );
      
      setTickets(updatedTickets);
      calculateStats(updatedTickets);
      
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      await supabase
        .from('tickets')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      );
      
      setTickets(updatedTickets);
      calculateStats(updatedTickets);
      
      toast.success(`Ticket priority updated to ${newPriority}`);
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleDueDateChange = async (ticketId: string, newDueDate: string) => {
    try {
      await supabase
        .from('tickets')
        .update({ due_date: newDueDate, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, due_date: newDueDate } : ticket
      );
      
      setTickets(updatedTickets);
      
      toast.success("Due date updated");
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date");
    }
  };

  // Function to handle equity allocation approval for tasks
  const approveTaskEquityAllocation = async (ticket: Ticket) => {
    if (!ticket.job_app_id || !ticket.task_id || !ticket.project_id) {
      toast.error("Missing required ticket information");
      return;
    }

    try {
      // First, get the task equity allocation
      const { data: taskData, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('equity_allocation')
        .eq('task_id', ticket.task_id)
        .single();
      
      if (taskError) throw taskError;
      
      // Update the accepted_jobs table with the approved equity
      const { error: updateError } = await supabase
        .from('accepted_jobs')
        .update({ 
          equity_agreed: taskData.equity_allocation 
        })
        .eq('job_app_id', ticket.job_app_id);
      
      if (updateError) throw updateError;
      
      // Mark ticket as completed
      await supabase
        .from('tickets')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);
      
      // Update project_sub_tasks status
      await supabase
        .from('project_sub_tasks')
        .update({ 
          task_status: 'completed',
          completion_percentage: 100
        })
        .eq('task_id', ticket.task_id);
      
      // Update business_projects equity_allocated
      await updateProjectEquityAllocated(ticket.project_id);
      
      // Refresh ticket list
      await loadTickets();
      
      toast.success("Equity allocation approved and task marked as completed");
    } catch (error) {
      console.error("Error approving equity allocation:", error);
      toast.error("Failed to approve equity allocation");
    }
  };

  // Function to update project equity allocated
  const updateProjectEquityAllocated = async (projectId: string) => {
    try {
      // Get all completed tasks for this project
      const { data: completedTasks, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('equity_allocation')
        .eq('project_id', projectId)
        .eq('task_status', 'completed');
      
      if (tasksError) throw tasksError;
      
      // Calculate total allocated equity
      const totalAllocated = completedTasks.reduce(
        (sum, task) => sum + (task.equity_allocation || 0), 
        0
      );
      
      // Update the project's equity_allocated field
      const { error: updateError } = await supabase
        .from('business_projects')
        .update({ equity_allocated: totalAllocated })
        .eq('project_id', projectId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating project equity allocated:", error);
      throw error;
    }
  };

  // Beta testing specific equity allocation
  const approveBetaTestingEquityAllocation = async (ticket: Ticket) => {
    if (!ticket.project_id) {
      toast.error("Missing project information");
      return;
    }
    
    // Check if this is the beta testing project
    if (ticket.project_id !== "1ec133ba-26d6-4112-8e44-f0b67ddc8fb4") {
      toast.error("This is not a beta testing ticket");
      return;
    }
    
    try {
      // Mark ticket as completed/closed
      await supabase
        .from('tickets')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);
      
      // Calculate beta testing equity - will be done later when distributing
      toast.success("Beta testing ticket approved. Equity will be calculated at distribution time.");
      
      // Refresh ticket list
      await loadTickets();
    } catch (error) {
      console.error("Error approving beta testing ticket:", error);
      toast.error("Failed to approve beta testing ticket");
    }
  };

  return (
    <div>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tickets</h2>
          <div className="flex space-x-2">
            {showCreateButton && !viewOnly && (
              <Button onClick={() => setIsTicketFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            )}
          </div>
        </div>
        
        <TicketStats
          totalTickets={totalTickets}
          openTickets={openTickets}
          closedTickets={closedTickets}
          highPriorityTickets={highPriorityTickets}
        />

        {/* Filter Bar */}
        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          dueDateFilter={dueDateFilter}
          setDueDateFilter={setDueDateFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClearFilters={clearFilters}
        />

        <Tabs defaultValue={view} onValueChange={(value) => setView(value as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <TicketList
              tickets={filteredTickets}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDueDateChange={handleDueDateChange}
              formatDate={formatDate}
              onTicketClick={onTicketClick}
              viewOnly={viewOnly}
              onApproveEquity={(ticket) => {
                // Check if this is a beta testing ticket
                if (ticket.project_id === "1ec133ba-26d6-4112-8e44-f0b67ddc8fb4") {
                  approveBetaTestingEquityAllocation(ticket);
                } else {
                  approveTaskEquityAllocation(ticket);
                }
              }}
            />
          </TabsContent>
          <TabsContent value="kanban">
            <TicketKanbanBoard
              tickets={filteredTickets}
              onStatusChange={handleStatusChange}
              onTicketClick={onTicketClick}
              viewOnly={viewOnly}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Ticket Form Modal */}
      <TicketForm
        isOpen={isTicketFormOpen}
        onOpenChange={setIsTicketFormOpen}
        onSubmit={handleCreateTicket}
        mode="create"
      />
    </div>
  );
};
