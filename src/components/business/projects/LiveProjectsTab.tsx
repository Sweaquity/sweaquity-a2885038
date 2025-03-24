
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Task, Ticket } from "@/types/types";
import { toast } from "sonner";
import { FilterBar } from "@/components/ticket/FilterBar";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TaskCompletionReview } from "../projects/TaskCompletionReview";
import { GanttChartView } from "../testing/GanttChartView";
import { DragDropContext } from "react-beautiful-dnd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Plus, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LiveProjectsTabProps {
  projectId?: string | null;
}

export const LiveProjectsTab: React.FC<LiveProjectsTabProps> = ({ projectId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    taskId: '',
    projectId: ''
  });

  useEffect(() => {
    fetchData();
    // Get the current business ID
    const getCurrentBusinessId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setBusinessId(data.user.id);
      }
    };
    getCurrentBusinessId();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch projects owned by the business
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);
      
      if (projectsData && projectsData.length > 0) {
        const firstProjectId = selectedProjectId || projectsData[0].project_id;
        setSelectedProjectId(firstProjectId);
        
        // Fetch project tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('*')
          .eq('project_id', firstProjectId);
          
        if (tasksError) throw tasksError;
        setProjectTasks(tasksData || []);
        
        // Fetch accepted jobs for this project
        const { data: jobsData, error: jobsError } = await supabase
          .from('accepted_jobs')
          .select(`
            *,
            job_applications (
              *,
              profiles:user_id (
                first_name,
                last_name,
                email
              )
            )
          `)
          .eq('job_applications.project_id', firstProjectId);
          
        if (jobsError) throw jobsError;
        setAcceptedJobs(jobsData || []);
      }

      // Fetch tickets
      await fetchTickets();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load projects data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .not('project_id', 'is', null);
        
      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId);
      }
        
      const { data, error } = await query;

      if (error) throw error;
      
      // Ensure all tickets have a description (required by type)
      const ticketsWithDescription = (data || []).map(ticket => ({
        ...ticket,
        description: ticket.description || ""
      }));
      
      setTickets(ticketsWithDescription);
      setFilteredTickets(ticketsWithDescription);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    }
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    
    try {
      // Fetch project tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (tasksError) throw tasksError;
      setProjectTasks(tasksData || []);
      
      // Fetch accepted jobs for this project
      const { data: jobsData, error: jobsError } = await supabase
        .from('accepted_jobs')
        .select(`
          *,
          job_applications (
            *,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('job_applications.project_id', projectId);
        
      if (jobsError) throw jobsError;
      setAcceptedJobs(jobsData || []);
      
      // Also update tickets
      await fetchTickets();
      
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error("Failed to load project details");
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // First update the ticket status in the tickets table
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;
      
      // Get the ticket to check if it's a task ticket
      const { data: ticketData, error: getError } = await supabase
        .from('tickets')
        .select('task_id, project_id')
        .eq('id', ticketId)
        .single();
        
      if (getError) throw getError;
      
      // If this is a task ticket, also update the project_sub_tasks table
      if (ticketData.task_id) {
        let taskStatus = newStatus;
        // Map ticket status to task status if different terminology is used
        if (newStatus === 'done') {
          taskStatus = 'pending_review';
        } else if (newStatus === 'closed') {
          taskStatus = 'completed';
        }
        
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            task_status: taskStatus,
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticketData.task_id);
        
        if (taskError) throw taskError;
      }
      
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: any) => {
    let filtered = [...tickets];

    if (newFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === newFilters.status);
    }

    if (newFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === newFilters.priority);
    }

    setFilteredTickets(filtered);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    updateTicketStatus(draggableId, destination.droppableId);
  };

  const handleTicketClick = async (ticket: Ticket) => {
    if (!ticket.task_id) return;

    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', ticket.task_id)
        .single();

      if (error) throw error;
      setSelectedTask(data);
      setShowReviewDialog(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error("Failed to load task details");
    }
  };

  const getGanttTasks = useCallback((): any[] => {
    return tickets.map(ticket => ({
      id: ticket.id,
      name: ticket.title,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      start: new Date(new Date().setDate(new Date().getDate() - 3)),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 4)),
      progress: ticket.status === 'done' ? 100 :
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task',
      isDisabled: false
    }));
  }, [tickets]);

  const handleCreateTicket = async () => {
    if (!newTicket.title || !selectedProjectId) {
      toast.error("Please enter a title and select a project");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description || "No description provided",
          priority: newTicket.priority,
          status: 'new',
          project_id: selectedProjectId,
          task_id: newTicket.taskId || null,
          health: 'good',
          reporter: businessId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      toast.success("Ticket created successfully");
      setCreateTicketDialogOpen(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        taskId: '',
        projectId: selectedProjectId
      });
      
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Tickets</CardTitle>
            <CardDescription>
              Manage tickets for projects and tasks
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select 
              value={selectedProjectId || ''} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={createTicketDialogOpen} onOpenChange={setCreateTicketDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                      placeholder="Ticket title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      placeholder="Ticket description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({...newTicket, priority: value})}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task">Task (Optional)</Label>
                    <Select
                      value={newTicket.taskId}
                      onValueChange={(value) => setNewTicket({...newTicket, taskId: value})}
                    >
                      <SelectTrigger id="task">
                        <SelectValue placeholder="Link to task (optional)" />
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
                  <Button type="submit" onClick={handleCreateTicket}>Create Ticket</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={fetchData}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading project data...</span>
            </div>
          ) : (
            <>
              {selectedProjectId && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Project Structure</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="tasks">
                      <AccordionTrigger>Project Tasks</AccordionTrigger>
                      <AccordionContent>
                        {projectTasks.length > 0 ? (
                          <div className="space-y-4">
                            {projectTasks.map(task => {
                              const taskTickets = tickets.filter(t => t.task_id === task.task_id);
                              const acceptedJob = acceptedJobs.find(
                                job => job.job_applications?.task_id === task.task_id
                              );
                              
                              return (
                                <div key={task.task_id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium">{task.title}</h4>
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm">Equity: {task.equity_allocation}%</div>
                                      <div className="text-sm">Status: {task.task_status || task.status}</div>
                                    </div>
                                  </div>
                                  
                                  {acceptedJob && (
                                    <div className="my-2 p-2 bg-muted rounded">
                                      <div className="text-sm font-medium">Assigned To:</div>
                                      <div className="text-sm">
                                        {acceptedJob.job_applications?.profiles?.first_name} {acceptedJob.job_applications?.profiles?.last_name}
                                      </div>
                                      <div className="text-sm">Equity Agreed: {acceptedJob.equity_agreed}%</div>
                                    </div>
                                  )}
                                  
                                  <div className="mt-2">
                                    <h5 className="text-sm font-medium mb-1">Tickets ({taskTickets.length})</h5>
                                    {taskTickets.length > 0 ? (
                                      <div className="space-y-2">
                                        {taskTickets.map(ticket => (
                                          <div key={ticket.id} className="flex justify-between items-center p-2 bg-background border rounded text-sm">
                                            <span>{ticket.title}</span>
                                            <span className="capitalize">{ticket.status}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No tickets for this task</p>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2" 
                                      onClick={() => {
                                        setNewTicket({
                                          ...newTicket,
                                          taskId: task.task_id,
                                          projectId: selectedProjectId
                                        });
                                        setCreateTicketDialogOpen(true);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add Ticket
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No tasks found for this project</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="jobs">
                      <AccordionTrigger>Accepted Jobs</AccordionTrigger>
                      <AccordionContent>
                        {acceptedJobs.length > 0 ? (
                          <div className="space-y-4">
                            {acceptedJobs.map(job => {
                              const taskData = projectTasks.find(
                                task => task.task_id === job.job_applications?.task_id
                              );
                              
                              return (
                                <div key={job.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        {taskData?.title || "Untitled Task"}
                                      </h4>
                                      <p className="text-sm">
                                        Assignee: {job.job_applications?.profiles?.first_name} {job.job_applications?.profiles?.last_name}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm">
                                      <div>Equity: {job.equity_agreed}%</div>
                                      <div>Accepted: {new Date(job.date_accepted).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No accepted jobs for this project</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            
              <Tabs defaultValue="kanban">
                <TabsList className="mb-4">
                  <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                  <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                </TabsList>
                
                <TabsContent value="kanban">
                  <FilterBar 
                    onFilterChange={handleFilterChange} 
                    statuses={['all', 'todo', 'in-progress', 'review', 'done', 'closed']}
                    priorities={['all', 'low', 'medium', 'high', 'urgent']}
                  />
                  
                  <div className="mt-4">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <KanbanBoard 
                        tickets={filteredTickets} 
                        onStatusChange={updateTicketStatus}
                        onTicketClick={handleTicketClick}
                      />
                    </DragDropContext>
                  </div>
                </TabsContent>
                
                <TabsContent value="gantt">
                  <GanttChartView tasks={getGanttTasks()} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Task review dialog */}
      {selectedTask && businessId && (
        <TaskCompletionReview 
          businessId={businessId}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          open={showReviewDialog}
          setOpen={setShowReviewDialog}
        />
      )}
    </div>
  );
};
