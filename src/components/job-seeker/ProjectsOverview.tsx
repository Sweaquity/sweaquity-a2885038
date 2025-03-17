
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EquityProject } from "@/types/jobSeeker";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronDown, Clock, Check, Plus, BarChart } from "lucide-react";
import { TimeTracker } from "@/components/business/testing/TimeTracker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Update the EquityProject type to include the documents property
interface ProjectWithDocuments extends EquityProject {
  documents?: {
    contract?: {
      url: string;
    };
  };
  tickets?: any[];
}

interface ProjectsOverviewProps {
  currentProjects?: ProjectWithDocuments[];
  pastProjects?: ProjectWithDocuments[];
  onDocumentAction?: (projectId: string, action: 'edit' | 'approve') => void;
}

export const ProjectsOverview = ({
  currentProjects = [],
  pastProjects = [],
  onDocumentAction = () => {}
}: ProjectsOverviewProps) => {
  const [expandedProjects, setExpandedProjects] = useState<{[key: string]: boolean}>({});
  const [projectTickets, setProjectTickets] = useState<{[key: string]: any[]}>({});
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    taskId: '',
    projectId: ''
  });
  const [trackingTab, setTrackingTab] = useState<'time' | 'progress'>('time');
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));

    // Load tickets if expanding and not yet loaded
    if (!expandedProjects[projectId] && !projectTickets[projectId]) {
      fetchProjectTickets(projectId);
    }
  };

  const fetchProjectTickets = async (projectId: string) => {
    setIsLoading(prev => ({ ...prev, [projectId]: true }));
    try {
      // Fetch tickets associated with this project
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      setProjectTickets(prev => ({
        ...prev,
        [projectId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching project tickets:', error);
      toast.error("Failed to load project tickets");
    } finally {
      setIsLoading(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const createTicket = async () => {
    try {
      // Validate form
      if (!newTicketData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      setIsCreatingTicket(true);
      
      // Create a new ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: newTicketData.title,
          description: newTicketData.description,
          status: newTicketData.status,
          priority: newTicketData.priority,
          health: 'green',
          project_id: newTicketData.projectId,
          task_id: newTicketData.taskId,
          reporter: userId,
          assigned_to: userId,
          ticket_type: 'task'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Ticket created successfully");
      
      // Reset form and refresh tickets
      setNewTicketData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        taskId: '',
        projectId: ''
      });
      setIsCreatingTicket(false);
      
      // Refresh tickets
      fetchProjectTickets(newTicketData.projectId);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
      setIsCreatingTicket(false);
    }
  };

  const handleTicketCreate = (projectId: string, taskId: string) => {
    setNewTicketData(prev => ({
      ...prev,
      projectId,
      taskId
    }));
    
    // Focus on the title input after a short delay
    setTimeout(() => {
      const titleInput = document.getElementById('new-ticket-title');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  };

  const updateTaskCompletion = async () => {
    if (!selectedTicketId) return;
    
    try {
      // First, get the ticket to check its task_id
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('task_id, project_id')
        .eq('id', selectedTicketId)
        .single();
        
      if (ticketError) throw ticketError;
      
      if (!ticketData.task_id) {
        toast.error("This ticket is not associated with a task");
        return;
      }
      
      // Update the task completion percentage
      const { error: updateError } = await supabase
        .from('project_sub_tasks')
        .update({ completion_percentage: completionPercentage })
        .eq('task_id', ticketData.task_id);
        
      if (updateError) throw updateError;
      
      // Update ticket status based on completion
      let newStatus = 'in-progress';
      if (completionPercentage >= 100) {
        newStatus = 'done';
      } else if (completionPercentage === 0) {
        newStatus = 'todo';
      }
      
      // Update the ticket status
      await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', selectedTicketId);
      
      toast.success(`Task progress updated to ${completionPercentage}%`);
      
      // Refresh tickets
      if (ticketData.project_id) {
        fetchProjectTickets(ticketData.project_id);
      }
      
    } catch (error) {
      console.error('Error updating task completion:', error);
      toast.error("Failed to update task completion");
    }
  };

  // Handler for when a ticket is selected
  const handleTicketSelect = async (ticketId: string) => {
    setSelectedTicketId(ticketId === selectedTicketId ? null : ticketId);
    
    // If selecting a ticket, fetch its task completion percentage
    if (ticketId !== selectedTicketId) {
      try {
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('task_id')
          .eq('id', ticketId)
          .single();
          
        if (ticketError) throw ticketError;
        
        if (ticketData.task_id) {
          const { data: taskData, error: taskError } = await supabase
            .from('project_sub_tasks')
            .select('completion_percentage')
            .eq('task_id', ticketData.task_id)
            .single();
            
          if (taskError) throw taskError;
          
          setCompletionPercentage(taskData.completion_percentage || 0);
        }
      } catch (error) {
        console.error('Error fetching task completion:', error);
        setCompletionPercentage(0);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Your current equity projects and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentProjects.map((project) => (
              <Collapsible 
                key={project.id} 
                open={expandedProjects[project.id]} 
                onOpenChange={() => toggleProjectExpansion(project.id)}
                className="border p-4 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedProjects[project.id] ? 'transform rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Status: {project.status}</p>
                  <p className="text-sm">Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Hours logged: {project.total_hours_logged}</p>
                </div>
                
                <CollapsibleContent className="mt-4 pt-4 border-t">
                  {project.documents?.contract && (
                    <div className="flex space-x-2 mb-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Preview Contract
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <iframe 
                            src={project.documents.contract.url} 
                            className="w-full h-full"
                            title="Contract Preview"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'edit')}
                      >
                        Edit Contract
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'approve')}
                      >
                        Approve Contract
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <h4 className="font-medium mb-2">Project Tasks & Tickets</h4>
                    
                    {isLoading[project.id] ? (
                      <p className="text-sm italic">Loading tickets...</p>
                    ) : (
                      <>
                        {/* Display project sub-tasks */}
                        {project.sub_tasks?.map((task) => (
                          <div key={task.task_id} className="mb-4 p-3 bg-secondary/20 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="mt-1">
                                  <p className="text-xs">Progress: {task.completion_percentage || 0}%</p>
                                  <Progress value={task.completion_percentage || 0} className="h-1.5 mt-1" />
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTicketCreate(project.id, task.task_id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Ticket
                              </Button>
                            </div>
                            
                            {/* Tickets associated with this task */}
                            {projectTickets[project.id]?.filter(ticket => ticket.task_id === task.task_id).length > 0 ? (
                              <div className="mt-2 space-y-2">
                                <p className="text-sm font-medium">Task Tickets:</p>
                                {projectTickets[project.id]
                                  .filter(ticket => ticket.task_id === task.task_id)
                                  .map(ticket => (
                                    <div key={ticket.id} className="flex justify-between items-center p-2 bg-background rounded border text-sm">
                                      <div>
                                        <p>{ticket.title}</p>
                                        <p className="text-xs text-muted-foreground">Status: {ticket.status}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant={selectedTicketId === ticket.id ? "default" : "ghost"}
                                          size="sm"
                                          onClick={() => handleTicketSelect(ticket.id)}
                                        >
                                          {selectedTicketId === ticket.id ? (
                                            <span>Close</span>
                                          ) : (
                                            <>
                                              <Clock className="h-4 w-4 mr-1" /> Track
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-xs mt-2 text-muted-foreground">No tickets yet</p>
                            )}
                          </div>
                        ))}

                        {/* New Ticket Creation Form */}
                        {newTicketData.projectId === project.id && (
                          <div className="mt-4 p-4 border rounded-md">
                            <h5 className="font-medium mb-2">Create New Ticket</h5>
                            <div className="space-y-3">
                              <div>
                                <Input 
                                  id="new-ticket-title"
                                  placeholder="Ticket title" 
                                  value={newTicketData.title}
                                  onChange={(e) => setNewTicketData(prev => ({ ...prev, title: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Textarea 
                                  placeholder="Description" 
                                  rows={3}
                                  value={newTicketData.description}
                                  onChange={(e) => setNewTicketData(prev => ({ ...prev, description: e.target.value }))}
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={createTicket} 
                                  disabled={isCreatingTicket}
                                >
                                  {isCreatingTicket ? 'Creating...' : 'Create Ticket'}
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => setNewTicketData({
                                    title: '',
                                    description: '',
                                    status: 'todo',
                                    priority: 'medium',
                                    taskId: '',
                                    projectId: ''
                                  })}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Time & Progress Tracker for selected ticket */}
                  {selectedTicketId && userId && (
                    <div className="mt-6 border-t pt-4">
                      <Tabs defaultValue="time" value={trackingTab} onValueChange={(value) => setTrackingTab(value as 'time' | 'progress')}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="time">
                            <Clock className="h-4 w-4 mr-2" />
                            Time Tracking
                          </TabsTrigger>
                          <TabsTrigger value="progress">
                            <BarChart className="h-4 w-4 mr-2" />
                            Progress Update
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="time">
                          <TimeTracker ticketId={selectedTicketId} userId={userId} />
                        </TabsContent>
                        
                        <TabsContent value="progress">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Task Completion Percentage
                              </label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={completionPercentage}
                                  onChange={(e) => setCompletionPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-20"
                                />
                                <span>%</span>
                                <Progress value={completionPercentage} className="flex-1 h-2" />
                              </div>
                            </div>
                            <Button onClick={updateTaskCompletion}>
                              Update Progress
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {currentProjects.length === 0 && (
              <p className="text-muted-foreground">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Projects</CardTitle>
          <CardDescription>Completed equity projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Final Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Total Hours: {project.total_hours_logged}</p>
                  <p className="text-sm">
                    Duration: {new Date(project.start_date).toLocaleDateString()} - {
                      project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'
                    }
                  </p>
                </div>
              </div>
            ))}
            {pastProjects.length === 0 && (
              <p className="text-muted-foreground">No past projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
