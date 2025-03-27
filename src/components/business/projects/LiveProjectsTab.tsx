import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { Ticket } from "@/types/types";
import { RefreshCw, KanbanSquare, BarChart2 } from "lucide-react";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TaskCompletionReview } from "./TaskCompletionReview";

interface LiveProjectsTabProps {
  businessId: string;
}

export const LiveProjectsTab = ({ businessId }: LiveProjectsTabProps) => {
  const [activeTab, setActiveTab] = useState("all-tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [taskStats, setTaskStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [reviewTask, setReviewTask] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchProjects();
      loadTickets();
    }
  }, [businessId]);
  
  useEffect(() => {
    if (businessId) {
      loadTickets();
    }
  }, [businessId, selectedProject]);

  const fetchProjects = async () => {
    if (!businessId) return;
    
    try {
      const { data: projectsData, error } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProjects(projectsData || []);
      
      if (projectsData && projectsData.length > 0 && selectedProject === "all") {
        // Keep "all" as the selected project
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          job_app_id,
          accepted_jobs:job_app_id(
            equity_agreed,
            jobs_equity_allocated
          )
        `);
      
      // Filter by project if one is selected and it's not "all"
      if (selectedProject && selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      } else {
        // If "all" is selected, get tickets from all projects owned by this business
        const { data: businessProjects } = await supabase
          .from('business_projects')
          .select('project_id')
          .eq('business_id', businessId);
          
        if (businessProjects && businessProjects.length > 0) {
          const projectIds = businessProjects.map(p => p.project_id);
          query = query.in('project_id', projectIds);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Loaded tickets:", data);
      
      // Convert data to the expected Ticket type format and include job_app_id/equity data
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        type: ticket.ticket_type || "task", // Map ticket_type to type for compatibility
        ticket_type: ticket.ticket_type || "task", // Ensure ticket_type is always set
        description: ticket.description || "", // Ensure description exists
        // Add equity information to the ticket
        equity_agreed: ticket.accepted_jobs?.equity_agreed || 0,
        equity_allocated: ticket.accepted_jobs?.jobs_equity_allocated || 0
      }));
      
      setTickets(processedTickets);
      
      // Calculate ticket stats
      const stats = {
        total: processedTickets.length,
        open: processedTickets.filter(t => t.status !== 'done' && t.status !== 'closed').length,
        closed: processedTickets.filter(t => t.status === 'done' || t.status === 'closed').length,
        highPriority: processedTickets.filter(t => t.priority === 'high').length
      };
      
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus': {
          // Update ticket status
          const { error } = await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          // Update local state
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, status: data } : t)
          );
          
          toast.success("Status updated");
          break;
        }
        
        case 'updatePriority': {
          const { error } = await supabase
            .from('tickets')
            .update({ priority: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, priority: data } : t)
          );
          
          toast.success("Priority updated");
          break;
        }
        
        case 'updateDueDate': {
          const { error } = await supabase
            .from('tickets')
            .update({ due_date: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, due_date: data } : t)
          );
          
          toast.success("Due date updated");
          break;
        }
        
        case 'updateCompletionPercentage': {
          const { error } = await supabase
            .from('tickets')
            .update({ completion_percentage: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, completion_percentage: data } : t)
          );
          
          toast.success("Completion percentage updated");
          break;
        }
        
        case 'updateEstimatedHours': {
          const { error } = await supabase
            .from('tickets')
            .update({ estimated_hours: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, estimated_hours: data } : t)
          );
          
          toast.success("Estimated hours updated");
          break;
        }
        
        case 'reviewCompletion': {
          // Find the ticket to review
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket) {
            setReviewTask(ticket);
            setIsReviewOpen(true);
          }
          break;
        }
        
        case 'addNote': {
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('businesses')
            .select('company_name')
            .eq('businesses_id', businessId)
            .single();
          
          const userName = profileData ? profileData.company_name : 'Business';
          
          const newNote = {
            id: Date.now().toString(),
            user: userName,
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          await supabase
            .from('tickets')
            .update({ notes: updatedNotes })
            .eq('id', ticketId);
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, notes: updatedNotes } : t)
          );
          
          toast.success("Note added");
          break;
        }
        
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleLogTime = async (ticketId: string) => {
    console.log("Log time button clicked for ticket:", ticketId);
  };

  const handleRefresh = () => {
    loadTickets();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTicket = () => {
    setIsCreateTicketDialogOpen(true);
  };

  const handleTicketCreated = async (ticketData: any): Promise<void> => {
    try {
      const ticketToCreate = {
        ...ticketData,
        reporter: businessId,
        created_at: new Date().toISOString(),
        ticket_type: ticketData.ticket_type || "task", // Using ticket_type instead of type
        status: "todo", // Changed from "new" to match Kanban column ids
        priority: ticketData.priority || "medium",
        health: ticketData.health || "good"
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketToCreate)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Ticket created successfully");
      if (data) {
        setTickets([data, ...tickets]);
      }
      setIsCreateTicketDialogOpen(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const getActiveTickets = () => {
    switch (activeTab) {
      case "project-tasks":
        return tickets.filter(t => t.ticket_type === "task");
      case "project-tickets":
        return tickets.filter(t => t.ticket_type === "ticket");
      case "beta-testing":
        return tickets.filter(t => t.ticket_type === "beta-test" || t.ticket_type === "beta_testing");
      default:
        return tickets;
    }
  };

  const toggleKanbanView = () => {
    setShowKanban(!showKanban);
    if (showKanban) {
      setShowGantt(false);
    }
  };

  const toggleGanttView = () => {
    setShowGantt(!showGantt);
    if (showGantt) {
      setShowKanban(false);
    }
  };

  const handleReviewClose = () => {
    setIsReviewOpen(false);
    setReviewTask(null);
    // Reload tickets to reflect changes
    loadTickets();
  };

  const renderTicketActions = (ticket: Ticket) => {
    // Only show review action for business users and if the ticket is in review status
    // AND completion percentage is 100%
    if ((ticket.status === 'review' || ticket.status === 'in review') && 
        ticket.completion_percentage === 100) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleTicketAction(ticket.id, 'reviewCompletion', null)}
        >
          Review
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <p className="text-muted-foreground">View and manage all your active projects</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Select value={selectedProject} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.length === 0 ? (
              <SelectItem value="none" disabled>No projects available</SelectItem>
            ) : (
              projects.map(project => (
                <SelectItem key={project.project_id} value={project.project_id}>
                  {project.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={showKanban ? "default" : "outline"} 
            onClick={toggleKanbanView}
          >
            <KanbanSquare className="h-4 w-4 mr-1" /> 
            {showKanban ? "Hide Kanban" : "Show Kanban"}
          </Button>
          
          <Button 
            size="sm" 
            variant={showGantt ? "default" : "outline"} 
            onClick={toggleGanttView}
          >
            <BarChart2 className="h-4 w-4 mr-1" /> 
            {showGantt ? "Hide Gantt" : "Show Gantt"}
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          
          <Button size="sm" onClick={handleCreateTicket}>
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-blue-700">All Tickets</div>
            <div className="text-2xl font-bold mt-1 text-blue-800">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-yellow-700">Open Tasks</div>
            <div className="text-2xl font-bold mt-1 text-yellow-800">{taskStats.open}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-green-700">Closed Tasks</div>
            <div className="text-2xl font-bold mt-1 text-green-800">{taskStats.closed}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-red-700">High Priority</div>
            <div className="text-2xl font-bold mt-1 text-red-800">{taskStats.highPriority}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
          <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
          <TabsTrigger value="beta-testing">Beta Testing Tickets</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {showKanban ? (
            <div className="mb-6">
              <KanbanBoard 
                tickets={getActiveTickets()}
                onStatusChange={(ticketId, newStatus) => 
                  handleTicketAction(ticketId, 'updateStatus', newStatus)
                }
                onTicketClick={(ticket) => {
                  console.log("Ticket clicked:", ticket.id);
                  // Here you could show a ticket detail dialog or navigate to a ticket details page
                }}
              />
            </div>
          ) : showGantt ? (
            <div className="mb-6">
              <div className="text-center py-8">
                <p>Gantt view is being implemented. Please check back later.</p>
              </div>
            </div>
          ) : (
            <TicketDashboard 
              initialTickets={getActiveTickets()}
              onRefresh={handleRefresh}
              onTicketAction={handleTicketAction}
              showTimeTracking={false}
              userId={businessId || ''}
              onLogTime={handleLogTime}
              renderTicketActions={renderTicketActions}
              userCanEditDates={true}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onClose={() => setIsCreateTicketDialogOpen(false)}
        onCreateTicket={handleTicketCreated}
        projects={projects}
      />

      {reviewTask && (
        <TaskCompletionReview
          businessId={businessId}
          task={reviewTask}
          open={isReviewOpen}
          setOpen={setIsReviewOpen}
          onClose={handleReviewClose}
        />
      )}
    </div>
  );
};
