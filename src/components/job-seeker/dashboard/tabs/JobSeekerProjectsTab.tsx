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
import { RefreshCw, KanbanSquare, BarChart2, Plus } from "lucide-react";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: { userId: string }) => {
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
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`);
      
      if (selectedProject && selectedProject !== "all") {
        query = query.eq('project_id', selectedProject);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        type: ticket.ticket_type || "task",
        description: ticket.description || "",
        health: ticket.health || "unknown"
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
    toast.info("Time logging functionality is in development");
  };

  const handleRefreshTickets = () => {
    loadTickets();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleCreateTicket = async (ticketData: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      if (!userId) {
        toast.error("User ID not found");
        return null;
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticketData,
          reporter: userId,
          created_at: new Date().toISOString(),
          ticket_type: "task",
          status: "new",
          priority: ticketData.priority || "medium",
          health: ticketData.health || "good"
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Ticket created successfully");
      setTickets([data, ...tickets]);
      setIsCreateTicketDialogOpen(false);
      return data;
    } catch (error) {
      console.error("Error creating ticket:", error);
      return null;
    }
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
              <DragDropContext onDragEnd={() => {}}>
                <KanbanBoard projectId={selectedProject !== "all" ? selectedProject : undefined} />
              </DragDropContext>
            ) : (
              <TicketDashboard
                tickets={tickets}
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
                cardStats={[
                  { label: 'All Tickets', value: taskStats.total, color: 'blue' },
                  { label: 'Open Tasks', value: taskStats.open, color: 'yellow' },
                  { label: 'Closed Tasks', value: taskStats.closed, color: 'green' },
                  { label: 'High Priority', value: taskStats.highPriority, color: 'red' }
                ]}
                showTimeLogDialog={true}
              />
            )}
          </TabsContent>
          
          <TabsContent value="project-tasks">
            <TicketDashboard
              tickets={tickets.filter(t => (t.type === 'task'))}
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
              userId={userId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
          
          <TabsContent value="project-tickets">
            <TicketDashboard
              tickets={tickets.filter(t => (t.type === 'project'))}
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
              userId={userId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
          
          <TabsContent value="beta-tickets">
            <TicketDashboard
              tickets={tickets.filter(t => (t.type === 'beta'))}
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
              userId={userId}
              onRefresh={handleRefreshTickets}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <p className="text-muted-foreground">View and manage your project tasks</p>
      </div>

      {renderTicketsSection()}

      <CreateTicketDialog
        open={isCreateTicketDialogOpen}
        onOpenChange={setIsCreateTicketDialogOpen}
        onCreateTicket={handleCreateTicket}
        projects={projects}
      />
    </div>
  );
};
