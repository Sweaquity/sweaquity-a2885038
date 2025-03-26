
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCompletionReview } from "@/components/business/projects/TaskCompletionReview";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { toast } from "sonner";
import { Ticket } from "@/types/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, KanbanSquare, BarChart2 } from "lucide-react";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { supabase } from "@/lib/supabase";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Provider } from "react-redux";
import { store } from "@/components/business/testing/store";

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
  const [reviewTicket, setReviewTicket] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showGantt, setShowGantt] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchProjects(businessId);
    }
  }, [businessId]);
  
  useEffect(() => {
    if (businessId && selectedProject) {
      loadTickets(businessId);
    }
  }, [businessId, selectedProject]);

  const fetchProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .select('project_id, title')
        .eq('business_id', userId);
      
      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async (userId: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
      
      // Filter by project if one is selected and it's not "all"
      if (selectedProject && selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        type: ticket.ticket_type || "task", // Map ticket_type to type for compatibility
        description: ticket.description || "",  // Ensure description exists
        health: ticket.health || "unknown" // Ensure health exists for BetaTicket compatibility
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
          
          // Check if ticket has a task_id, if so update related tables
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket?.task_id) {
            try {
              const { error: rpcError } = await supabase.rpc('update_active_project', {
                p_task_id: ticket.task_id,
                p_status: data
              });
              
              if (rpcError) {
                console.error("Error in RPC call:", rpcError);
              }
            } catch (e) {
              console.error("Error updating related tables:", e);
            }
          }
          
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
        
        case 'updateCompletion': {
          const { error } = await supabase
            .from('tickets')
            .update({ completion_percentage: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
          setTickets(prevTickets => 
            prevTickets.map(t => t.id === ticketId ? { ...t, completion_percentage: data } : t)
          );
          
          // Check if ticket has a task_id, if so update related tables
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket?.task_id) {
            try {
              // Update project_sub_tasks directly
              await supabase
                .from('project_sub_tasks')
                .update({ 
                  completion_percentage: data,
                  // If completion is 100%, mark as ready for review
                  status: data >= 100 ? 'review' : 'in_progress',
                  task_status: data >= 100 ? 'review' : 'active',
                  last_activity_at: new Date().toISOString()
                })
                .eq('task_id', ticket.task_id);
              
              // Also update the ticket status to review if 100% complete
              if (data >= 100) {
                await supabase
                  .from('tickets')
                  .update({ status: 'review' })
                  .eq('id', ticketId);
                
                setTickets(prevTickets => 
                  prevTickets.map(t => t.id === ticketId ? { ...t, status: 'review' } : t)
                );
              }
              
              // Update the business_projects table with aggregate completion
              if (ticket.project_id) {
                await updateProjectCompletion(ticket.project_id);
              }
              
              // Call the RPC function to update jobseeker view
              const { error: rpcError } = await supabase.rpc('update_active_project', {
                p_task_id: ticket.task_id,
                p_completion_percentage: data,
                p_status: data >= 100 ? 'review' : 'in_progress'
              });
              
              if (rpcError) {
                console.error("Error in RPC call:", rpcError);
              }
            } catch (e) {
              console.error("Error updating related tables:", e);
            }
          }
          
          toast.success("Completion percentage updated");
          break;
        }
        
        default:
          console.warn("Unhandled ticket action:", action);
      }
      
      // Refresh tickets after any action
      await loadTickets(businessId);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast.error(`Failed to ${action.replace('update', 'update ')}`);
    }
  };

  const updateProjectCompletion = async (projectId: string) => {
    try {
      // Get all tasks for this project
      const { data: tasks, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (tasksError) throw tasksError;
      
      if (!tasks || tasks.length === 0) return;
      
      // Calculate weighted completion percentage
      let totalEquity = 0;
      let totalCompletedEquity = 0;
      
      tasks.forEach(task => {
        const equity = task.equity_allocation || 0;
        totalEquity += equity;
        totalCompletedEquity += equity * (task.completion_percentage || 0) / 100;
      });
      
      const completionPercentage = totalEquity > 0 
        ? (totalCompletedEquity / totalEquity) * 100 
        : 0;
      
      // Get equity allocated from accepted_jobs
      const { data: acceptedJobs, error: jobsError } = await supabase
        .from('accepted_jobs')
        .select('job_app_id, equity_agreed, jobs_equity_allocated')
        .in('job_app_id', tasks.map(t => t.job_app_id).filter(Boolean));
        
      if (jobsError) throw jobsError;
      
      let totalEquityAllocated = 0;
      if (acceptedJobs) {
        acceptedJobs.forEach(job => {
          totalEquityAllocated += job.jobs_equity_allocated || 0;
        });
      }
      
      // Update business_projects
      await supabase
        .from('business_projects')
        .update({
          completion_percentage: Math.round(completionPercentage),
          equity_allocated: totalEquityAllocated,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);
    } catch (error) {
      console.error("Error updating project completion:", error);
    }
  };

  const handleRefreshTickets = () => {
    loadTickets(businessId);
  };

  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    try {
      // Create ticket with the project_id from the form
      const newTicket = {
        ...ticketData,
        reporter: businessId,
        created_by: businessId
      };
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Ticket created successfully");
      setIsCreateTicketDialogOpen(false);
      
      // Refresh tickets
      loadTickets(businessId);
      
      return data;
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
      return null;
    }
  };

  const handleReviewTicket = (ticket: any) => {
    setReviewTicket(ticket);
    setIsReviewDialogOpen(true);
  };

  const handleDragEnd = (result: DropResult) => {
    // Implementation of drag end logic for Kanban
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Update ticket status
    handleTicketAction(draggableId, 'updateStatus', newStatus);
  };

  const renderTicketsSection = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Select 
              value={selectedProject} 
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowKanban(!showKanban)}
            >
              <KanbanSquare className="mr-2 h-4 w-4" />
              Kanban
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGantt(!showGantt)}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Gantt
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshTickets}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsCreateTicketDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
            <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
            <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
            <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-tickets">
            {showKanban ? (
              <Provider store={store}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <KanbanBoard projectId={selectedProject !== "all" ? selectedProject : undefined} />
                </DragDropContext>
              </Provider>
            ) : (
              <TicketDashboard
                tickets={tickets}
                isLoading={loading}
                handleTicketAction={handleTicketAction}
                renderTicketActions={(ticket) => (
                  <div className="flex space-x-2">
                    {ticket.status === 'review' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleReviewTicket(ticket)}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                )}
                columns={[
                  { field: 'title', header: 'Title' },
                  { field: 'status', header: 'Status' },
                  { field: 'priority', header: 'Priority' },
                  { field: 'hours_logged', header: 'Hours' },
                  { 
                    field: 'completion_percentage', 
                    header: 'Completion',
                    render: (ticket) => `${ticket.completion_percentage || 0}%`
                  }
                ]}
                cardStats={[
                  { label: 'All Tickets', value: taskStats.total, color: 'blue' },
                  { label: 'Open Tasks', value: taskStats.open, color: 'yellow' },
                  { label: 'Closed Tasks', value: taskStats.closed, color: 'green' },
                  { label: 'High Priority', value: taskStats.highPriority, color: 'red' }
                ]}
                showTimeLogDialog={true}
                userId={businessId}
                onRefresh={handleRefreshTickets}
              />
            )}
          </TabsContent>
          
          <TabsContent value="project-tasks">
            <TicketDashboard
              tickets={tickets.filter(t => (t.ticket_type === 'task' || t.type === 'task'))}
              isLoading={loading}
              handleTicketAction={handleTicketAction}
              renderTicketActions={(ticket) => (
                <div className="flex space-x-2">
                  {ticket.status === 'review' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleReviewTicket(ticket)}
                    >
                      Review
                    </Button>
                  )}
                </div>
              )}
              columns={[
                { field: 'title', header: 'Title' },
                { field: 'status', header: 'Status' },
                { field: 'priority', header: 'Priority' },
                { field: 'hours_logged', header: 'Hours' },
                { 
                  field: 'completion_percentage', 
                  header: 'Completion',
                  render: (ticket) => `${ticket.completion_percentage || 0}%`
                }
              ]}
              showTimeLogDialog={true}
              userId={businessId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
          
          <TabsContent value="project-tickets">
            <TicketDashboard
              tickets={tickets.filter(t => (t.ticket_type === 'project' || t.type === 'project'))}
              isLoading={loading}
              handleTicketAction={handleTicketAction}
              columns={[
                { field: 'title', header: 'Title' },
                { field: 'status', header: 'Status' },
                { field: 'priority', header: 'Priority' },
                { field: 'hours_logged', header: 'Hours' },
                { 
                  field: 'completion_percentage', 
                  header: 'Completion',
                  render: (ticket) => `${ticket.completion_percentage || 0}%`
                }
              ]}
              showTimeLogDialog={true}
              userId={businessId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
          
          <TabsContent value="beta-tickets">
            <TicketDashboard
              tickets={tickets.filter(t => (t.ticket_type === 'beta' || t.type === 'beta'))}
              isLoading={loading}
              handleTicketAction={handleTicketAction}
              columns={[
                { field: 'title', header: 'Title' },
                { field: 'status', header: 'Status' },
                { field: 'priority', header: 'Priority' },
                { field: 'hours_logged', header: 'Hours' },
                { 
                  field: 'completion_percentage', 
                  header: 'Completion',
                  render: (ticket) => `${ticket.completion_percentage || 0}%`
                }
              ]}
              showTimeLogDialog={true}
              userId={businessId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {renderTicketsSection()}
        
        <CreateTicketDialog
          open={isCreateTicketDialogOpen}
          onOpenChange={setIsCreateTicketDialogOpen}
          onCreateTicket={handleCreateTicket}
          projects={projects}
        />
        
        {reviewTicket && (
          <TaskCompletionReview
            businessId={businessId}
            task={reviewTicket}
            open={isReviewDialogOpen}
            setOpen={setIsReviewDialogOpen}
            onClose={() => {
              setReviewTicket(null);
              loadTickets(businessId);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};
