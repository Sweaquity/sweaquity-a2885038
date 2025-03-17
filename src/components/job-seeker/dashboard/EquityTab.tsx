
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EquityProject, LogEffort } from "@/types/jobSeeker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, FileText, ArrowUpToLine, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EquityTabProps {
  equityProjects?: EquityProject[];
  logEffort?: LogEffort;
  onLogEffort?: (projectId: string) => void;
  onLogEffortChange?: (projectId: string, field: 'hours' | 'description', value: string | number) => void;
}

export const EquityTab = ({ 
  equityProjects = [],
  logEffort,
  onLogEffort = () => {},
  onLogEffortChange = () => {}
}: EquityTabProps) => {
  const [selectedProject, setSelectedProject] = useState<EquityProject | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateTicketDialogOpen, setIsCreateTicketDialogOpen] = useState(false);
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [projectTickets, setProjectTickets] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
      setIsLoading(false);
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (equityProjects.length > 0) {
      equityProjects.forEach(project => {
        fetchProjectTickets(project.id);
      });
    }
  }, [equityProjects]);

  const fetchProjectTickets = async (projectId: string) => {
    try {
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
    }
  };

  const handleLogEffort = async () => {
    if (!selectedProject || !selectedTaskId) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to log effort");
        return;
      }
      
      const { error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: selectedTaskId,
          user_id: session.user.id,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });
        
      if (error) throw error;
      
      toast.success("Time logged successfully");
      setIsDialogOpen(false);
      setHours(0);
      setDescription('');
      
      fetchProjectTickets(selectedProject.id);
    } catch (error) {
      console.error('Error logging effort:', error);
      toast.error("Failed to log effort");
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedProject || !selectedTaskId) {
      toast.error("Please select a project and task first");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: ticketTitle,
          description: ticketDescription,
          status: 'todo',
          priority: ticketPriority,
          health: 'green',
          project_id: selectedProject.id,
          task_id: selectedTaskId,
          reporter: userId,
          assigned_to: userId,
          ticket_type: 'task'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Ticket created successfully");
      setIsCreateTicketDialogOpen(false);
      setTicketTitle('');
      setTicketDescription('');
      setTicketPriority('medium');
      
      fetchProjectTickets(selectedProject.id);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Current Equity Projects</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equityProjects.length === 0 && (
              <p className="text-muted-foreground">No active equity projects.</p>
            )}
            
            {equityProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <Badge>{project.status}</Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Equity Allocation</p>
                    <p className="font-medium">{project.equity_amount}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Frame</p>
                    <p className="font-medium">{project.time_allocated}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours Logged</p>
                    <p className="font-medium">{project.total_hours_logged || 0} hours</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project);
                        setIsCreateTicketDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Button>
                  </div>
                  
                  <div className="mt-2 space-y-2">
                    {project.sub_tasks?.map((task) => (
                      <div key={task.task_id} className="text-sm p-3 bg-secondary/50 rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium">{task.title}</p>
                          <span>{task.completion_percentage}% complete</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{task.description}</p>
                        
                        {projectTickets[project.id]?.filter(ticket => ticket.task_id === task.task_id).length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium">Tickets:</p>
                            {projectTickets[project.id]
                              .filter(ticket => ticket.task_id === task.task_id)
                              .map(ticket => (
                                <div key={ticket.id} className="bg-background rounded p-2 text-xs flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{ticket.title}</p>
                                    <p className="text-muted-foreground">{ticket.status} - {ticket.priority} priority</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProject(project);
                                        setSelectedTaskId(ticket.id);
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      <Clock className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        
                        <div className="flex mt-3 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedTaskId(task.task_id);
                              setIsCreateTicketDialogOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Ticket
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedTaskId(task.task_id);
                              setIsUploadDialogOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <ArrowUpToLine className="h-4 w-4 mr-2" />
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedTaskId && selectedTaskId === project.id && (
                  <div className="mt-6 border-t pt-4">
                    <Tabs defaultValue="timeTracking">
                      <TabsList>
                        <TabsTrigger value="timeTracking">Time Tracker</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="timeTracking">
                        <TimeTracker ticketId={selectedTaskId} userId={userId} />
                      </TabsContent>
                      
                      <TabsContent value="documents">
                        <p>Document management will appear here</p>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>
              Record the time you've spent working on {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description of Work</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you accomplished during this time"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogEffort}>Log Hours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCreateTicketDialogOpen} onOpenChange={setIsCreateTicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Ticket</DialogTitle>
            <DialogDescription>
              Create a new ticket for {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticketTitle">Ticket Title</Label>
              <Input
                id="ticketTitle"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="Enter ticket title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketDescription">Description</Label>
              <Textarea
                id="ticketDescription"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Describe what needs to be done"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticketPriority">Priority</Label>
              <Select value={ticketPriority} onValueChange={setTicketPriority}>
                <SelectTrigger>
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
            
            {selectedProject?.sub_tasks && selectedProject.sub_tasks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="taskId">Associated Task</Label>
                <Select 
                  value={selectedTaskId || ''} 
                  onValueChange={(value) => setSelectedTaskId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProject.sub_tasks.map(task => (
                      <SelectItem key={task.task_id} value={task.task_id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTicketDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document related to your work on {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentTitle">Document Title</Label>
              <Input id="documentTitle" placeholder="Enter document title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentDescription">Description</Label>
              <Textarea
                id="documentDescription"
                placeholder="Describe this document"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentFile">File</Label>
              <Input id="documentFile" type="file" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button>Upload Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const TicketActions = ({ project, task, onCreateTicket }) => {
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task?.task_id) {
      fetchTickets(task.task_id);
    }
  }, [task]);

  const fetchTickets = async (taskId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Tickets</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onCreateTicket(project, task);
          }}
        >
          Create Ticket
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-2">
          <span className="text-sm text-muted-foreground">Loading tickets...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-md border p-4 text-center">
          <p className="text-sm text-muted-foreground">No tickets found for this task.</p>
          <p className="text-sm mt-1">Create a ticket to track your work.</p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {tickets.map(ticket => (
            <div key={ticket.id} className="border rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{ticket.title}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      ticket.status === 'done' ? 'default' :
                      ticket.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {ticket.status}
                    </Badge>
                    {ticket.priority && (
                      <Badge variant={
                        ticket.priority === 'high' ? 'destructive' :
                        ticket.priority === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {ticket.priority}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ticket.due_date && (
                    <div>Due: {new Date(ticket.due_date).toLocaleDateString()}</div>
                  )}
                  {ticket.estimated_hours && (
                    <div>Est: {ticket.estimated_hours}h</div>
                  )}
                </div>
              </div>
              {ticket.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {ticket.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
