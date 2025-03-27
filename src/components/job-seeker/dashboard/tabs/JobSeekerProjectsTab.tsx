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
import { DragDropContext } from "react-beautiful-dnd";

interface JobSeekerProjectsTabProps {
  userId?: string | null;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
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

  useEffect(() => {
    if (userId) {
      fetchProjects();
      loadTickets();
    }
  }, [userId]);
  
  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId, selectedProject]);

  const fetchProjects = async () => {
    if (!userId) return;
    
    try {
      const { data: projectsData, error } = await supabase
        .from('jobseeker_active_projects')
        .select('project_id, project_title')
        .eq('user_id', userId)
        .order('project_title', { ascending: true });
      
      if (error) throw error;
      
      const uniqueProjects = Array.from(
        new Map(projectsData.map(item => [item.project_id, item])).values()
      );
      
      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          accepted_jobs:job_app_id(
            equity_agreed,
            jobs_equity_allocated
          )
        `)
        .or(`assigned_to.eq.${userId},reporter.eq.${userId}`);
      
      if (selectedProject && selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const filteredTickets = (data || []).filter(ticket => {
        if (ticket.accepted_jobs && 
            ticket.accepted_jobs.equity_agreed > 0 && 
            ticket.accepted_jobs.jobs_equity_allocated >= ticket.accepted_jobs.equity_agreed) {
          return false;
        }
        return true;
      });
      
      const processedTickets = filteredTickets.map(ticket => ({
        ...ticket,
        ticket_type: ticket.ticket_type || "task",
        description: ticket.description || "",
        equity_agreed: ticket.accepted_jobs?.equity_agreed || 0,
        equity_allocated: ticket.accepted_jobs?.jobs_equity_allocated || 0
      }));
      
      setTickets(processedTickets);
      
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
          const { error } = await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          if (error) throw error;
          
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
        
        case 'addNote': {
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
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
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      toast.error("Ticket not found");
      return;
    }
    
    toast.info("Time logging functionality is in development");
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
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      
      const ticketToCreate = {
        ...ticketData,
        reporter: userId,
        created_at: new Date().toISOString(),
        ticket_type: ticketData.ticket_type || "task",
        status: "todo",
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
    if (activeTab === 'project-tasks') {
      return tickets.filter(t => t.ticket_type === "task" || t.type === "task");
    } else if (activeTab === 'project-tickets') {
      return tickets.filter(t => t.ticket_type === "ticket" || t.type === "ticket");
    } else if (activeTab === 'beta-testing') {
      return tickets.filter(t => 
        t.ticket_type === "beta-test" || 
        t.ticket_type === "beta_testing" || 
        t.type === "beta-test" || 
        t.type === "beta_testing"
      );
    }
    return tickets;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <p className="text-muted-foreground">View and manage your project tasks</p>
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
                  {project.project_title}
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
              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const { draggableId, destination } = result;
                handleTicketAction(draggableId, 'updateStatus', destination.droppableId);
              }}>
                <KanbanBoard 
                  tickets={getActiveTickets()}
                  onStatusChange={(ticketId, newStatus) => 
                    handleTicketAction(ticketId, 'updateStatus', newStatus)
                  }
                  onTicketClick={(ticket) => {
                    console.log("Ticket clicked:", ticket.id);
                  }}
                />
              </DragDropContext>
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
              showTimeTracking={true}
              userId={userId || ''}
              onLogTime={handleLogTime}
              userCanEditDates={true}
              showEstimatedHours={true}
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
    </div>
  );
};
