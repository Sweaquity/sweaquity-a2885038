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
  
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [logTimeForm, setLogTimeForm] = useState({
    hours: 0,
    description: "",
    ticketId: ""
  });

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
          .map(job => {
            if (job.job_applications && 'project_id' in job.job_applications) {
              return job.job_applications.project_id;
            }
            return null;
          })
          .filter(Boolean) as string[];
        
        if (projectIds.length > 0) {
          const uniqueProjectIds = [...new Set(projectIds)];
          
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
      const { data: acceptedApps, error: appsError } = await supabase
        .from('job_applications')
        .select('task_id, project_id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .eq('status', 'accepted');
        
      if (appsError) throw appsError;
      
      if (acceptedApps && acceptedApps.length > 0) {
        const taskIds = acceptedApps.map(app => app.task_id).filter(Boolean);
        
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

  const loadAllTickets = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
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
            const appData = job.job_applications as { task_id?: string; project_id?: string };
            if (appData.project_id) projectIds.push(appData.project_id);
            if (appData.task_id) taskIds.push(appData.task_id);
          }
        });
        
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
      
      const allTickets = [...betaTicketsWithMeta, ...projectTickets];
      
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
      
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        taskId: '',
        projectId: ''
      });
      
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

  const handleTicketAction = useCallback(async (ticketId: string, action: string, data: any) => {
    try {
      let ticket: Ticket | undefined;
      
      // Get the current ticket data before update
      if (action === 'updateStatus' || action === 'updateCompletion') {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*, task_id, project_id')
          .eq('id', ticketId)
          .single();
          
        if (ticketError) throw ticketError;
        ticket = ticketData;
      }
      
      switch (action) {
        case 'updateStatus':
          await supabase
            .from('tickets')
            .update({ 
              status: data || 'new',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Ticket status updated");
          
          // Update completion percentage based on status
          let completionPercentage = 0;
          if (data === 'in-progress') completionPercentage = 50;
          else if (data === 'review') completionPercentage = 75;
          else if (data === 'done') completionPercentage = 100;
          
          // If it's a task ticket, update the task completion percentage
          if (ticket?.task_id) {
            // Update the project_sub_tasks table
            await supabase
              .from('project_sub_tasks')
              .update({ 
                completion_percentage: completionPercentage,
                last_activity_at: new Date().toISOString()
              })
              .eq('task_id', ticket.task_id);
              
            // Also update the jobseeker_active_projects view/table if it exists
            try {
              const { data: jobData } = await supabase
                .from('job_applications')
                .select('job_app_id')
                .eq('task_id', ticket.task_id)
                .eq('user_id', userId)
                .single();
                
              if (jobData?.job_app_id) {
                await supabase
                  .from('accepted_jobs')
                  .update({
                    equity_agreed: (completionPercentage / 100) * (ticket.equity_points || 0)
                  })
                  .eq('job_app_id', jobData.job_app_id);
              }
            } catch (error) {
              console.error('Error updating job application data:', error);
            }
          }
          break;
          
        case 'updateCompletion':
          // Direct update to completion percentage
          const completionValue = parseInt(data, 10) || 0;
          
          await supabase
            .from('tickets')
            .update({ 
              completion_percentage: completionValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          // If it's a task ticket, update the task completion percentage
          if (ticket?.task_id) {
            await supabase
              .from('project_sub_tasks')
              .update({ 
                completion_percentage: completionValue,
                last_activity_at: new Date().toISOString()
              })
              .eq('task_id', ticket.task_id);
          }
          
          toast.success("Completion percentage updated");
          break;
          
        case 'updatePriority':
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
          
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .maybeSingle();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
            
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}` : 
            'User';
          
          const newNote = {
            id: Date.now().toString(),
            user: userName.trim(),
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
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
      
      loadAllTickets();
    } catch (error) {
      console.error(`Error handling ticket action ${action}:`, error);
      toast.error(`Failed to perform action: ${action}`);
    }
  }, [userId, loadAllTickets]);

  const handleLogTime = async (ticketId: string) => {
    if (!userId || !ticketId || !logTimeForm.hours || !logTimeForm.description) {
      toast.error("Please enter hours and description");
      return;
    }
    
    try {
      // First get the ticket details to check if it's associated with a task
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, project_id, equity_points, estimated_hours')
        .eq('id', ticketId)
        .single();
        
      if (ticketError) throw ticketError;
      
      // Add the time entry
      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          hours_logged: logTimeForm.hours,
          description: logTimeForm.description,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Time logged successfully");
      
      // Update the task completion percentage based on logged hours
      if (ticketData?.task_id) {
        // Get total hours logged for this ticket
        const { data: totalHoursData, error: totalHoursError } = await supabase
          .from('time_entries')
          .select('hours_logged')
          .eq('ticket_id', ticketId);
          
        if (totalHoursError) throw totalHoursError;
        
        const totalHours = (totalHoursData || []).reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
        
        // Calculate completion percentage based on estimated hours or just set to 'in progress'
        let completionPercentage = 50; // Default to 50% if we don't have estimated hours
        
        if (ticketData.estimated_hours && ticketData.estimated_hours > 0) {
          completionPercentage = Math.min(100, Math.round((totalHours / ticketData.estimated_hours) * 100));
        }
        
        // Update both the ticket and the task
        await supabase
          .from('tickets')
          .update({ 
            completion_percentage: completionPercentage,
            status: completionPercentage >= 100 ? 'done' : 'in-progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);
          
        await supabase
          .from('project_sub_tasks')
          .update({ 
            completion_percentage: completionPercentage,
            task_status: completionPercentage >= 100 ? 'completed' : 'in-progress',
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticketData.task_id);
          
        // Update the job application if applicable
        try {
          const { data: jobData } = await supabase
            .from('job_applications')
            .select('job_app_id')
            .eq('task_id', ticketData.task_id)
            .eq('user_id', userId)
            .single();
            
          if (jobData?.job_app_id) {
            // Calculate earned equity based on completion percentage
            const earnedEquity = (completionPercentage / 100) * (ticketData.equity_points || 0);
            
            await supabase
              .from('accepted_jobs')
              .update({
                equity_agreed: earnedEquity
              })
              .eq('job_app_id', jobData.job_app_id);
          }
        } catch (error) {
          console.error('Error updating job application data:', error);
        }
      }
      
      setLogTimeForm({
        hours: 0,
        description: "",
        ticketId: ""
      });
      
      loadTimeEntries(ticketId);
      loadAllTickets(); // Refresh tickets to reflect updated status
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error("Failed to log time");
    }
  };

  const handleToggleTicket = useCallback((ticketId: string, isExpanded: boolean) => {
    console.log("Toggle ticket:", ticketId, "expanded:", isExpanded);
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
    } else {
      // Only clear if this is the currently selected ticket
      if (selectedTicket === ticketId) {
        setSelectedTicket(null);
      }
    }
    
    // Force a refresh of the tickets state to ensure expanded state is reflected
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, expanded: isExpanded } 
        : ticket
    ));
  }, [selectedTicket, loadTimeEntries]);

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

  const handleKanbanStatusChange = useCallback((ticketId: string, newStatus: string) => {
    handleTicketAction(ticketId, 'updateStatus', newStatus);
  }, [handleTicketAction]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    loadProjectTasks(projectId);
  };

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
                      {projects.length === 0 ? (
                        <SelectItem value="no-projects">No projects available</SelectItem>
                      ) : (
                        projects.map(project => (
                          <SelectItem key={project.project_id} value={project.project_id}>
                            {project.title}
                          </SelectItem>
                        ))
                      )}
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
                        <Label htmlFor="hours">Estimated Hours</Label>
                        <Input
                          id="hours"
                          type="number"
                          min="0.5"
                          step="0.5"
                          placeholder="Estimated hours to complete"
                          onChange={(e) => setNewTicket(prev => ({ 
                            ...prev, 
                            estimated_hours: parseFloat(e.target.value) 
                          }))}
                        />
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
                            <SelectItem value="no-task">None</SelectItem>
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
                    <div className="mb-
