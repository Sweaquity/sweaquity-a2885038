
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
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";

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
  userTickets?: any[];
  onTicketAction?: (ticketId: string, action: string, data?: any) => void;
  refreshTickets?: () => void;
}

export const ProjectsOverview = ({
  currentProjects = [],
  pastProjects = [],
  onDocumentAction = () => {},
  userTickets = [],
  onTicketAction = () => {},
  refreshTickets = () => {}
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
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [projectEquity, setProjectEquity] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        fetchTimeEntries(session.user.id);
      }
    };
    getUserId();
  }, []);

  // Use userTickets from props to initialize project tickets
  useEffect(() => {
    if (userTickets && userTickets.length > 0) {
      const ticketsByProject: {[key: string]: any[]} = {};
      
      userTickets.forEach(ticket => {
        if (ticket.project_id) {
          if (!ticketsByProject[ticket.project_id]) {
            ticketsByProject[ticket.project_id] = [];
          }
          ticketsByProject[ticket.project_id].push(ticket);
        }
      });
      
      setProjectTickets(ticketsByProject);
    }
  }, [userTickets]);

  // Fetch time entries for the current user
  const fetchTimeEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setTimeEntries(data || []);

      // Calculate total hours logged per project/ticket
      calculateProjectEquity(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  // Calculate earned equity based on task completion and time entries
  const calculateProjectEquity = (entries: any[]) => {
    if (!currentProjects || !entries.length) return;

    const equityByProject: {[key: string]: number} = {};

    currentProjects.forEach(project => {
      let totalEarnedEquity = 0;
      let totalAllocatedEquity = project.equity_amount || 0;

      // Get all sub-tasks for this project
      const subTasks = project.sub_tasks || [];
      
      subTasks.forEach(task => {
        // Calculate what percentage of the task is complete
        const completionPercentage = task.completion_percentage || 0;
        
        // Get the task's equity allocation
        const taskEquityAllocation = task.equity_allocation || 0;
        
        // Calculate earned equity based on completion percentage
        const earnedEquity = (taskEquityAllocation * completionPercentage) / 100;
        
        totalEarnedEquity += earnedEquity;
      });

      equityByProject[project.id] = Math.min(totalEarnedEquity, totalAllocatedEquity);
    });

    setProjectEquity(equityByProject);
  };

  // Calculate total hours logged for a specific project
  const calculateProjectHours = (projectId: string) => {
    const projectRelatedEntries = timeEntries.filter(entry => {
      // Find if this time entry is related to any ticket in this project
      const relatedTickets = projectTickets[projectId] || [];
      return relatedTickets.some(ticket => ticket.id === entry.ticket_id);
    });

    return projectRelatedEntries.reduce((total, entry) => total + (entry.hours_logged || 0), 0);
  };

  // Calculate hours logged for a specific ticket
  const calculateTicketHours = (ticketId: string) => {
    const ticketEntries = timeEntries.filter(entry => entry.ticket_id === ticketId);
    return ticketEntries.reduce((total, entry) => total + (entry.hours_logged || 0), 0);
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const createTicket = async () => {
    try {
      // Validate form
      if (!newTicketData.title.trim()) {
        toast.error("Title is required");
        return;
      }

      setIsCreatingTicket(true);
      
      // Create a new ticket using the provided onTicketAction handler
      await onTicketAction('new', 'create', {
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
      });
      
      toast.success("Ticket created successfully");
      
      // Reset form
      setNewTicketData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        taskId: '',
        projectId: ''
      });
      setIsCreatingTicket(false);
      
      // Refresh tickets using the provided handler
      refreshTickets();
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
      // Update task progress and ticket status via the parent handler
      await onTicketAction(selectedTicketId, 'update_task_progress', { 
        completion_percentage: completionPercentage 
      });
      
      toast.success(`Task progress updated to ${completionPercentage}%`);
      
      // Refresh tickets
      refreshTickets();
      
    } catch (error) {
      console.error('Error updating task completion:', error);
      toast.error("Failed to update task completion");
    }
  };

  // Handler for when a ticket is selected
  const handleTicketSelect = async (ticketId: string) => {
    if (selectedTicketId === ticketId) {
      setSelectedTicketId(null);
      return;
    }
    
    setSelectedTicketId(ticketId);
    
    // Fetch ticket messages
    try {
      if (userId) {
        const { data: messages, error } = await supabase
          .from('user_messages')
          .select('*')
          .eq('related_ticket', ticketId);
          
        if (error) throw error;
        setTicketMessages(messages || []);
      }
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
    }
    
    // Fetch task completion if this ticket is linked to a task
    const ticket = userTickets.find(t => t.id === ticketId);
    
    if (ticket && ticket.task_id) {
      try {
        const { data: taskData, error: taskError } = await supabase
          .from('project_sub_tasks')
          .select('completion_percentage')
          .eq('task_id', ticket.task_id)
          .single();
          
        if (taskError) throw taskError;
        
        setCompletionPercentage(taskData?.completion_percentage || 0);
      } catch (error) {
        console.error('Error fetching task completion:', error);
        setCompletionPercentage(0);
      }
    }
  };
  
  // Helper function to get tickets for a specific project
  const getProjectTickets = (projectId: string) => {
    return projectTickets[projectId] || [];
  };

  // Check if a ticket is currently expanded
  const isTicketExpanded = (ticketId: string) => {
    return selectedTicketId === ticketId;
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
                
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{project.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Equity</p>
                    <p className="font-medium">{project.equity_amount}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Earned Equity</p>
                    <p className="font-medium">{projectEquity[project.id]?.toFixed(2) || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours Logged</p>
                    <p className="font-medium">{calculateProjectHours(project.id).toFixed(1)} hours</p>
                  </div>
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
                              <div className="flex-1">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="mt-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Progress: {task.completion_percentage || 0}%</span>
                                    <span>Equity: {task.equity_allocation}%</span>
                                  </div>
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
                            {getProjectTickets(project.id).filter(ticket => ticket.task_id === task.task_id).length > 0 ? (
                              <div className="mt-2 space-y-2">
                                <p className="text-sm font-medium">Task Tickets:</p>
                                {getProjectTickets(project.id)
                                  .filter(ticket => ticket.task_id === task.task_id)
                                  .map(ticket => (
                                    <div key={ticket.id} className="p-2 bg-background rounded border">
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <p className="font-medium">{ticket.title}</p>
                                          <div className="flex text-xs text-muted-foreground gap-2">
                                            <span>Status: {ticket.status}</span>
                                            <span>Priority: {ticket.priority}</span>
                                            <span>Hours: {calculateTicketHours(ticket.id)}</span>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button 
                                            variant={isTicketExpanded(ticket.id) ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => handleTicketSelect(ticket.id)}
                                          >
                                            {isTicketExpanded(ticket.id) ? (
                                              <span>Close</span>
                                            ) : (
                                              <>
                                                <Clock className="h-4 w-4 mr-1" /> Track
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onTicketAction(ticket.id, 'update_status', { 
                                              status: ticket.status === 'done' ? 'todo' : 'done' 
                                            })}
                                          >
                                            {ticket.status === 'done' ? (
                                              <span>Reopen</span>
                                            ) : (
                                              <>
                                                <Check className="h-4 w-4 mr-1" /> Complete
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {isTicketExpanded(ticket.id) && (
                                        <div className="mt-4 border-t pt-4">
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
                                              {userId && (
                                                <TimeTracker ticketId={ticket.id} userId={userId} />
                                              )}
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
                                          
                                          {/* Expanded ticket details */}
                                          <div className="mt-4 pt-4 border-t">
                                            <ExpandedTicketDetails
                                              ticket={ticket}
                                              messages={ticketMessages.filter(m => m.related_ticket === ticket.id)}
                                              hoursLogged={calculateTicketHours(ticket.id)}
                                              onAction={onTicketAction}
                                            />
                                          </div>
                                        </div>
                                      )}
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
