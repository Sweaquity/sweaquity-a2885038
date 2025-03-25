
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
import { Plus, RefreshCw } from "lucide-react";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { supabase } from "@/lib/supabase";

interface LiveProjectsTabProps {
  businessId: string;
}

export const LiveProjectsTab = ({ businessId }: LiveProjectsTabProps) => {
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [reviewTicket, setReviewTicket] = useState<any>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

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
      
      if (data && data.length > 0) {
        setSelectedProject(data[0].project_id);
      }
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
      
      // Filter by project if one is selected
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        description: ticket.description || ""  // Ensure description exists
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
          
          // Update active project if this is a task
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket?.task_id) {
            try {
              const { error: rpcError } = await supabase.rpc('update_active_project', {
                p_task_id: ticket.task_id,
                p_due_date: data
              });
              
              if (rpcError) {
                console.error("Error in RPC call:", rpcError);
              }
            } catch (e) {
              console.error("Error updating related tables:", e);
            }
          }
          
          toast.success("Due date updated");
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
          
          // Update active project if this is a task
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket?.task_id) {
            try {
              const { error: rpcError } = await supabase.rpc('update_active_project', {
                p_task_id: ticket.task_id,
                p_estimated_hours: data
              });
              
              if (rpcError) {
                console.error("Error in RPC call:", rpcError);
              }
            } catch (e) {
              console.error("Error updating related tables:", e);
            }
          }
          
          toast.success("Estimated hours updated");
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
          
          // Update active project if this is a task
          const ticket = tickets.find(t => t.id === ticketId);
          if (ticket?.task_id) {
            try {
              const { error: rpcError } = await supabase.rpc('update_active_project', {
                p_task_id: ticket.task_id,
                p_completion_percentage: data
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
        
        case 'addNote':
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', businessId)
            .single();
          
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
            'User';
          
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
        
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleRefresh = () => {
    if (businessId) {
      loadTickets(businessId);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTicket = () => {
    // This would open a dialog to create a new ticket
    toast.info("Create ticket functionality will be implemented soon");
  };

  const renderTicketActions = (ticket: any) => {
    // For tickets in "review" status with 100% completion, show review buttons
    if (ticket.status === 'review' && ticket.completion_percentage === 100) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setReviewTicket(ticket);
            setIsReviewDialogOpen(true);
          }}
        >
          Review Task
        </Button>
      );
    }
    return null;
  };

  const handleReviewClose = () => {
    setIsReviewDialogOpen(false);
    setReviewTicket(null);
    handleRefresh();
  };

  if (!businessId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <p className="text-muted-foreground">View and manage your project tasks</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Select value={selectedProject || "none"} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.length === 0 ? (
              <SelectItem value="none">No projects available</SelectItem>
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
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          
          <Button size="sm" onClick={handleCreateTicket}>
            <Plus className="h-4 w-4 mr-1" /> Create Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">All Tickets</div>
            <div className="text-2xl font-bold mt-1">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">Open Tasks</div>
            <div className="text-2xl font-bold mt-1">{taskStats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">Closed Tasks</div>
            <div className="text-2xl font-bold mt-1">{taskStats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">High Priority</div>
            <div className="text-2xl font-bold mt-1">{taskStats.highPriority}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
          <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
          <TabsTrigger value="task-review">Task Completion Review</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets">
          <TicketDashboard 
            initialTickets={tickets}
            onRefresh={handleRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={false}
            userId={businessId}
          />
        </TabsContent>
        
        <TabsContent value="project-tasks">
          <TicketDashboard 
            initialTickets={tickets.filter(t => t.task_id)}
            onRefresh={handleRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={false}
            userId={businessId}
          />
        </TabsContent>
        
        <TabsContent value="project-tickets">
          <TicketDashboard 
            initialTickets={tickets.filter(t => t.project_id && !t.task_id)}
            onRefresh={handleRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={false}
            userId={businessId}
          />
        </TabsContent>
        
        <TabsContent value="task-review">
          <TaskCompletionReview businessId={businessId} />
        </TabsContent>
        
        <TabsContent value="kanban">
          {selectedProject ? (
            <KanbanBoard 
              tickets={tickets}
              onStatusChange={(ticketId, newStatus) => 
                handleTicketAction(ticketId, 'updateStatus', newStatus)
              }
              onTicketClick={(ticket) => {
                // For "review" status tickets with 100% completion, open the review dialog
                if (ticket.status === 'review' && ticket.completion_percentage === 100) {
                  setReviewTicket(ticket);
                  setIsReviewDialogOpen(true);
                } else {
                  console.log("Ticket clicked:", ticket.id);
                }
              }}
            />
          ) : (
            <div className="text-center py-8">Please select a project to view the Kanban board</div>
          )}
        </TabsContent>
        
        <TabsContent value="gantt">
          {selectedProject ? (
            <GanttChartView projectId={selectedProject} />
          ) : (
            <div className="text-center py-8">Please select a project to view the Gantt chart</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Completion Review Dialog */}
      {reviewTicket && (
        <TaskCompletionReview 
          businessId={businessId}
          task={reviewTicket}
          open={isReviewDialogOpen} 
          setOpen={setIsReviewDialogOpen}
          onClose={handleReviewClose}
        />
      )}
    </div>
  );
};
