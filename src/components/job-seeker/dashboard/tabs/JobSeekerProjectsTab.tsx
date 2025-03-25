import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { Loader2, Eye, EyeOff, Clock, Calendar, BarChart4, KanbanSquare, Plus } from "lucide-react";
import KanbanBoard from "@/components/ui/kanban-board";
import { GanttChart, convertItemsToGanttTasks } from "@/components/ticket/GanttChart";
import { DragDropContext } from "react-beautiful-dnd";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

// Define interfaces for better type safety
interface JobApplication {
  task_id: string;
  project_id: string;
  status: string;
  user_id: string;
}

interface JobSeekerProjectsTabProps {
  userId?: string;
  initialTabValue?: string;
}

interface Project {
  project_id: string;
  title: string;
  [key: string]: any;
}

interface ProjectTask {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  completion_percentage: number;
  timeframe: string;
  equity_allocation: number;
  [key: string]: any;
}

export const JobSeekerProjectsTab = ({ userId, initialTabValue = "all-tickets" }: JobSeekerProjectsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });
  const [activeTab, setActiveTab] = useState(initialTabValue);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(false);
  
  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [logTimeForm, setLogTimeForm] = useState({
    hours: 0,
    description: "",
    ticketId: ""
  });

  // New project and task state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    taskId: '',
    projectId: ''
  });

  useEffect(() => {
    if (userId) {
      loadAllTickets();
      loadUserProjects();
    }
  }, [userId]);

  const loadUserProjects = async () => {
    if (!userId) return;
    
    try {
      // First get all projects where the user has accepted jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('accepted_jobs')
        .select(`
          job_app_id,
          job_applications!inner (
            task_id,
            project_id,
            status,
            user_id
          )
        `)
        .eq('job_applications.user_id', userId)
        .eq('job_applications.status', 'accepted');
        
      if (jobsError) throw jobsError;
      
      if (jobsData && jobsData.length > 0) {
        const projectIds = jobsData
          .map(job => job.job_applications?.project_id)
          .filter(Boolean) as string[];
        
        if (projectIds.length > 0) {
          const uniqueProjectIds = [...new Set(projectIds)];
          
          // Load project details
          const { data: projectsData, error: projectsError } = await supabase
            .from('business_projects')
            .select(`
              *,
              businesses (
                company_name
              )
            `)
            .in('project_id', uniqueProjectIds);
            
          if (projectsError) throw projectsError;
          
          setProjects(projectsData || []);
          
          if (projectsData && projectsData.length > 0) {
            setSelectedProject(projectsData[0].project_id);
            
            // Load tasks for the first project
            await loadProjectTasks(projectsData[0].project_id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user projects:', error);
      toast.error("Failed to load projects");
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      // Load tasks for this project that the user has accepted
      const { data: acceptedApps, error: appsError } = await supabase
        .from('job_applications')
        .select('task_id, project_id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('status', 'accepted') as { data: JobApplication[] | null, error: any };
        
      if (appsError) throw appsError;
      
      if (acceptedApps && acceptedApps.length > 0) {
        const taskIds = acceptedApps.map(app => app.task_id).filter(Boolean);
        
        // Load task details
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .in('task_id', taskIds);
          
        if (tasksError) throw tasksError;
        
        setProjectTasks(tasksData || []);
      } else {
        setProjectTasks([]);
      }
    } catch (error) {
      console.error('Error loading project tasks:', error);
      toast.error("Failed to load tasks");
    }
  };

  // ... rest of the code remains the same as the previous implementation

  // The rest of the component remains unchanged
  // Only the type definitions and the loadProjectTasks function have been modified

  return (
    <div className="space-y-6">
      {/* Existing component code */}
    </div>
  );
};

  // Load all tickets for the job seeker
  const loadAllTickets = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 1. First load beta testing tickets reported by the user
      const { data: betaTickets, error: betaError } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`)
        .is('project_id', null);

      if (betaError) throw betaError;
      
      const betaTicketsWithMeta = (betaTickets || []).map(ticket => ({
        ...ticket,
        expanded: expandedTickets[ticket.id] || false,
        isProjectTicket: false,
        isTaskTicket: false
      }));
      
      // 2. Load project-related tickets from accepted jobs
      const { data: acceptedJobs, error: acceptedJobsError } = await supabase
        .from('accepted_jobs')
        .select(`
          job_app_id,
          equity_agreed,
          job_applications (
            task_id,
            project_id,
            user_id
          )
        `)
        .eq('job_applications.user_id', userId);

      if (acceptedJobsError) throw acceptedJobsError;
      
      let projectTickets: Ticket[] = [];
      
      if (acceptedJobs && acceptedJobs.length > 0) {
        const projectIds: string[] = [];
        const taskIds: string[] = [];
          
        acceptedJobs.forEach(job => {
          if (job.job_applications) {
            // Fix: Access nested properties correctly with type assertion
            const appData = job.job_applications as { task_id?: string; project_id?: string };
            if (appData.project_id) projectIds.push(appData.project_id);
            if (appData.task_id) taskIds.push(appData.task_id);
          }
        });
        
        // Load project descriptions
        const taskDescriptions: Record<string, string> = {};
        if (taskIds.length > 0) {
          const { data: taskDetails } = await supabase
            .from('project_sub_tasks')
            .select('task_id, description')
            .in('task_id', taskIds);
            
          if (taskDetails) {
            taskDetails.forEach(task => {
              taskDescriptions[task.task_id] = task.description || '';
            });
          }
        }
        
        // Load project tickets
        if (projectIds.length > 0) {
          const { data: pTickets } = await supabase
            .from('tickets')
            .select('*')
            .in('project_id', projectIds);
            
          if (pTickets) {
            projectTickets = [
              ...projectTickets,
              ...(pTickets.map(ticket => ({
                ...ticket,
                expanded: expandedTickets[ticket.id] || false,
                isProjectTicket: true,
                isTaskTicket: false
              })))
            ];
          }
        }
        
        // Load task tickets
        if (taskIds.length > 0) {
          const { data: tTickets } = await supabase
            .from('tickets')
            .select('*')
            .in('task_id', taskIds);
            
          if (tTickets) {
            projectTickets = [
              ...projectTickets,
              ...(tTickets.map(ticket => ({
                ...ticket,
                expanded: expandedTickets[ticket.id] || false,
                isProjectTicket: true,
                isTaskTicket: true,
                description: taskDescriptions[ticket.task_id || ''] || ticket.description || ''
              })))
            ];
          }
        }
      }
      
      // Combine all tickets
      const allTickets = [...betaTicketsWithMeta, ...projectTickets];
      
      // Remove duplicates
      const uniqueTickets = allTickets.filter((ticket, index, self) => 
        index === self.findIndex(t => t.id === ticket.id)
      );
      
      setTickets(uniqueTickets);
      calculateTicketStats(uniqueTickets);
      
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [userId, expandedTickets]);

  // Create a new ticket
  const handleCreateTicket = async () => {
    if (!userId || !newTicket.title) {
      toast.error("Please fill in the required fields");
      return;
    }
    
    try {
      const ticketData: any = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority || 'medium',
        status: 'new',
        health: 'healthy',
        reporter: userId,
        created_by: userId
      };
      
      if (newTicket.taskId) {
        ticketData.task_id = newTicket.taskId;
      }
      
      if (newTicket.projectId) {
        ticketData.project_id = newTicket.projectId;
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select('*')
        .single();
        
      if (error) throw error;
      
      toast.success("Ticket created successfully");
      setCreateTicketDialogOpen(false);
      
      // Reset form
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        taskId: '',
        projectId: ''
      });
      
      // Refresh tickets
      loadAllTickets();
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    }
  };

  const loadTimeEntries = useCallback(async (ticketId: string) => {
    if (!userId || !ticketId) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  }, [userId]);

  // Calculate ticket statistics for the dashboard
  const calculateTicketStats = (ticketData: Ticket[]) => {
    const totalTickets = ticketData.length;
    const openTickets = ticketData.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketData.filter(ticket => 
      ticket.priority === 'high'
    ).length;

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    ticketData.forEach(ticket => {
      const status = ticket.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      const priority = ticket.priority || 'unknown';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });

    setTicketStats({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority
    });
  };

  // Handle ticket actions
  const handleTicketAction = useCallback(async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus':
          // Update ticket status
          await supabase
            .from('tickets')
            .update({ 
              status: data || 'new',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Ticket status updated");
          break;
          
        case 'updatePriority':
          // Update ticket priority
          await supabase
            .from('tickets')
            .update({ 
              priority: data || 'medium',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Priority updated");
          break;
          
        case 'updateDueDate':
          // Update due date
          await supabase
            .from('tickets')
            .update({ 
              due_date: data,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Due date updated");
          break;
          
        case 'addNote':
          if (!userId || !data.trim()) return;
          
          // Get ticket details
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .maybeSingle();
          
          // Get user details
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
            
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}` : 
            'User';
          
          // Create new note
          const newNote = {
            id: Date.now().toString(),
            user: userName.trim(),
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          // Update notes array
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          // Save to database
          await supabase
            .from('tickets')
            .update({ 
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Note added successfully");
          break;
          
        default:
          console.warn('Unknown action:', action);
      }
      
      // Refresh tickets after any update
      loadAllTickets();
    } catch (error) {
      console.error(`Error handling ticket action ${action}:`, error);
      toast.error(`Failed to perform action: ${action}`);
    }
  }, [userId, loadAllTickets]);

  // Log time for a ticket
  const handleLogTime = async (ticketId: string) => {
    if (!userId || !ticketId || !logTimeForm.hours || !logTimeForm.description) {
      toast.error("Please enter hours and description");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: logTimeForm.hours,
          description: logTimeForm.description,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast.success("Time logged successfully");
      
      // Reset form
      setLogTimeForm({
        hours: 0,
        description: "",
        ticketId: ""
      });
      
      // Refresh time entries
      loadTimeEntries(ticketId);
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error("Failed to log time");
    }
  };

  // Handle expanding/collapsing ticket details
  const handleToggleTicket = useCallback((ticketId: string, isExpanded: boolean) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanded
    }));
    
    if (isExpanded) {
      setSelectedTicket(ticketId);
      loadTimeEntries(ticketId);
      setLogTimeForm(prev => ({
        ...prev,
        ticketId: ticketId
      }));
    } else if (selectedTicket === ticketId) {
      setSelectedTicket(null);
    }
  }, [selectedTicket, loadTimeEntries]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setDashboardKey(prev => prev + 1);
    loadAllTickets();
    if (selectedProject) {
      loadProjectTasks(selectedProject);
    }
    if (selectedTicket) {
      loadTimeEntries(selectedTicket);
    }
  }, [loadAllTickets, selectedTicket, loadTimeEntries, selectedProject, loadProjectTasks]);

  // Handle kanban status change
  const handleKanbanStatusChange = useCallback((ticketId: string, newStatus: string) => {
    handleTicketAction(ticketId, 'updateStatus', newStatus);
  }, [handleTicketAction]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Project selection handler
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    loadProjectTasks(projectId);
  };

  // Prepare kanban columns
  const getKanbanColumns = () => {
    const statuses = ['new', 'in-progress', 'review', 'done', 'blocked'];
    const columns: Record<string, { id: string; title: string; ticketIds: string[] }> = {};
    
    statuses.forEach(status => {
      columns[status] = {
        id: status,
        title: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
        ticketIds: tickets.filter(t => t.status === status).map(t => t.id)
      };
    });
    
    return columns;
  };
  
  // Prepare kanban tickets
  const getKanbanTickets = () => {
    const ticketMap: Record<string, any> = {};
    
    tickets.forEach(ticket => {
      ticketMap[ticket.id] = {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        due_date: ticket.due_date
      };
    });
    
    return ticketMap;
  };

  if (!userId) {
    return <div>User ID is required to show projects</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>View and manage your project tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowKanban(!showKanban)}
                size="sm"
              >
                {showKanban ? <EyeOff className="h-4 w-4 mr-2" /> : <KanbanSquare className="h-4 w-4 mr-2" />}
                {showKanban ? "Hide Kanban" : "Show Kanban"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowGantt(!showGantt)}
                size="sm"
              >
                {showGantt ? <EyeOff className="h-4 w-4 mr-2" /> : <BarChart4 className="h-4 w-4 mr-2" />}
                {showGantt ? "Hide Gantt" : "Show Gantt"}
              </Button>
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-64">
                  <Select 
                    value={selectedProject || ''}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.project_id} value={project.project_id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={createTicketDialogOpen} onOpenChange={setCreateTicketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newTicket.title}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ticket title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTicket.description}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the issue or task"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newTicket.priority}
                          onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="task">Associated Task</Label>
                        <Select
                          value={newTicket.taskId}
                          onValueChange={(value) => setNewTicket(prev => ({ ...prev, taskId: value }))}
                        >
                          <SelectTrigger id="task">
                            <SelectValue placeholder="Select a task (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {projectTasks.map(task => (
                              <SelectItem key={task.task_id} value={task.task_id}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateTicketDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateTicket}>Create Ticket</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
                  <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
                  <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
                  <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all-tickets">
                  <TicketStats
                    totalTickets={ticketStats.totalTickets}
                    openTickets={ticketStats.openTickets}
                    closedTickets={ticketStats.closedTickets}
                    highPriorityTickets={ticketStats.highPriorityTickets}
                    byStatus={ticketStats.byStatus}
                    byPriority={ticketStats.byPriority}
                  />
                  
                  {showKanban && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Kanban Board</h3>
                      <DragDropContext onDragEnd={(result) => {
                        if (!result.destination) return;
                        const { draggableId, destination } = result;
                        handleKanbanStatusChange(draggableId, destination.droppableId);
                      }}>
                        <KanbanBoard
                          columns={getKanbanColumns()}
                          tickets={getKanbanTickets()}
                          onTicketMove={handleKanbanStatusChange}
                          onTicketClick={(id) => {
                            const ticket = tickets.find(t => t.id === id);
                            if (ticket) {
                              setSelectedTicket(id);
                              handleToggleTicket(id, true);
                            }
                          }}
                          formatDate={formatDate}
                        />
                      </DragDropContext>
                    </div>
                  )}
                  
                  {showGantt && (
                    <div className="mb-6 overflow-x-auto">
                      <h3 className="text-lg font-medium mb-3">Gantt Chart</h3>
                      <div className="min-h-[400px]">
                        <GanttChart tasks={convertItemsToGanttTasks(tickets)} />
                      </div>
                    </div>
                  )}
                  
                  <TicketDashboard
                    key={`all-${dashboardKey}`}
                    initialTickets={tickets}
                    onRefresh={handleRefresh}
                    onTicketExpand={handleToggleTicket}
                    onTicketAction={handleTicketAction}
                    showTimeTracking={true}
                    currentUserId={userId}
                  />
                </TabsContent>
                
                <TabsContent value="project-tasks">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Project Tasks</h3>
                    
                    {projectTasks.length === 0 ? (
                      <p className="text-muted-foreground">No tasks found for this project.</p>
                    ) : (
                      <div className="space-y-4">
                        {projectTasks.map(task => (
                          <Card key={task.task_id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <CardTitle className="text-base">{task.title}</CardTitle>
                                <div className="text-sm text-muted-foreground">
                                  {task.completion_percentage}% complete
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-2">{task.description}</p>
                              <div className="flex justify-between text-sm">
                                <div>Timeframe: {task.timeframe}</div>
                                <div>Equity: {task.equity_allocation}%</div>
                              </div>
                              
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Related Tickets</h4>
                                {tickets.filter(t => t.task_id === task.task_id).length > 0 ? (
                                  <div className="space-y-2">
                                    {tickets
                                      .filter(t => t.task_id === task.task_id)
                                      .map(ticket => (
                                        <div 
                                          key={ticket.id}
                                          className="p-2 border rounded-md cursor-pointer hover:bg-muted"
                                          onClick={() => {
                                            setSelectedTicket(ticket.id);
                                            handleToggleTicket(ticket.id, true);
                                            setActiveTab('all-tickets');
                                          }}
                                        >
                                          <div className="flex justify-between">
                                            <div className="font-medium">{ticket.title}</div>
                                            <div className="text-sm text-muted-foreground">{ticket.status}</div>
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No tickets for this task yet.</p>
                                )}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => {
                                    setNewTicket(prev => ({
                                      ...prev,
                                      taskId: task.task_id,
                                      projectId: task.project_id
                                    }));
                                    setCreateTicketDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Ticket
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="project-tickets">
                  <TicketDashboard
                    key={`project-${dashboardKey}`}
                    initialTickets={tickets.filter(ticket => ticket.isProjectTicket && !ticket.isTaskTicket)}
                    onRefresh={handleRefresh}
                    onTicketExpand={handleToggleTicket}
                    onTicketAction={handleTicketAction}
                    showTimeTracking={true}
                    currentUserId={userId}
                  />
                </TabsContent>
                
                <TabsContent value="beta-tickets">
                  <TicketDashboard
                    key={`beta-${dashboardKey}`}
                    initialTickets={tickets.filter(ticket => !ticket.isProjectTicket)}
                    onRefresh={handleRefresh}
                    onTicketExpand={handleToggleTicket}
                    onTicketAction={handleTicketAction}
                    showTimeTracking={false}
                    currentUserId={userId}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
          
          {selectedTicket && userId && tickets.find(t => t.id === selectedTicket)?.isTaskTicket && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-4">Log Time</h3>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="hours">Hours</Label>
                          <Input
                            id="hours"
                            type="number"
                            min="0.25"
                            step="0.25"
                            value={logTimeForm.hours || ""}
                            onChange={(e) => setLogTimeForm(prev => ({
                              ...prev,
                              hours: parseFloat(e.target.value)
                            }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="What did you work on?"
                            value={logTimeForm.description}
                            onChange={(e) => setLogTimeForm(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                          />
                        </div>
                        <Button 
                          onClick={() => handleLogTime(selectedTicket)}
                          disabled={!logTimeForm.hours || !logTimeForm.description}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Log Time
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-4">Time Entries</h3>
                      {timeEntries.length > 0 ? (
                        <div className="space-y-4">
                          {timeEntries.map((entry) => (
                            <div key={entry.id} className="border p-4 rounded-md">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{entry.hours_logged} hours</div>
                                <div className="text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4 inline mr-1" />
                                  {formatDate(entry.created_at)}
                                </div>
                              </div>
                              <p className="mt-2 text-sm">{entry.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No time entries yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
