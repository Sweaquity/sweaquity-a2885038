
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
import { Ticket, TicketStatistics } from "@/types/types";
import { RefreshCw, KanbanSquare, BarChart2 } from "lucide-react";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";
import TicketStats from "@/components/ticket/TicketStats";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [activeTab, setActiveTab] = useState("all-tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [taskStats, setTaskStats] = useState<TicketStatistics>({
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

      console.log("Loaded tickets:", data);
      
      if (error) throw error;
      
      // Include the ticket type property for compatibility
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        ticket_type: ticket.ticket_type || ticket.type || "task",
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
    try {
      // Get the ticket
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        toast.error("Ticket not found");
        return;
      }
      
      // Simple prompt for hours (in a real app would be a proper form)
      const hours = window.prompt("Enter hours to log:", "1");
      if (!hours) return;
      
      const hoursLogged = parseFloat(hours);
      if (isNaN(hoursLogged) || hoursLogged <= 0) {
        toast.error("Please enter a valid number of hours");
        return;
      }
      
      // Create time entry
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: hoursLogged,
          start_time: new Date().toISOString(),
          description: `Time logged for ticket: ${ticket.title}`
        });
        
      if (error) throw error;
      
      toast.success(`Logged ${hoursLogged} hours for this ticket`);
      loadTickets(); // Refresh data
      
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    }
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
        health: ticketData.health || "good",
        description: ticketData.description || ""
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
        return tickets.filter(t => t.ticket_type === "beta-test");
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

      <TicketStats 
        totalTickets={taskStats.total}
        openTickets={taskStats.open}
        closedTickets={taskStats.closed}
        highPriorityTickets={taskStats.highPriority}
        byStatus={{}}
        byPriority={{}}
      />
      
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
                
                handleTicketAction(
                  result.draggableId, 
                  'updateStatus', 
                  result.destination.droppableId
                );
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
