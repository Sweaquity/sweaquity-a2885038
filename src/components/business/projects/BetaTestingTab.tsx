import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertTriangle, FileText, RefreshCw, Plus, KanbanSquare, BarChart2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskCompletionReview } from "./TaskCompletionReview";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";

interface BetaTestingTabProps {
  businessId: string;
}

export const BetaTestingTab = ({ businessId }: BetaTestingTabProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketsMap, setTicketsMap] = useState<{[key: string]: any[]}>({
    'new': [],
    'in-progress': [],
    'review': [],
    'done': [],
    'blocked': []
  });
  const [ticketMetrics, setTicketMetrics] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'beta-test'
  });
  const [isCompletionReviewOpen, setIsCompletionReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (businessId) {
      loadProjects();
      loadUsers();
    }
  }, [businessId]);

  useEffect(() => {
    if (selectedProject) {
      loadTickets();
    }
  }, [selectedProject, statusFilter, priorityFilter, activeTab]);

  useEffect(() => {
    if (tickets.length > 0) {
      organizeTicketsByStatus();
      calculateMetrics();
    }
  }, [tickets]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', businessId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProjects(data);
        setSelectedProject(data[0].project_id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
      
      if (error) throw error;
      
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadTickets = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          job_applications(user_id, status),
          time_entries(
            id,
            description,
            start_time, 
            end_time,
            hours_logged
          )
        `)
        .eq('project_id', selectedProject);
      
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (priorityFilter && priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      
      if (activeTab === 'project-tasks') {
        query = query.eq('ticket_type', 'task');
      } else if (activeTab === 'project-tickets') {
        query = query.eq('ticket_type', 'ticket');
      } else if (activeTab === 'beta-testing') {
        query = query.eq('ticket_type', 'beta-test');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = await Promise.all((data || []).map(async (ticket) => {
        const hoursLogged = ticket.time_entries?.reduce((total: number, entry: any) => {
          return total + (entry.hours_logged || 0);
        }, 0) || 0;
        
        const equityEarned = ticket.equity_points * (ticket.completion_percentage / 100);
        
        let assigneeDetails = null;
        if (ticket.assigned_to) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', ticket.assigned_to)
            .single();
            
          assigneeDetails = userData;
        }
        
        return {
          ...ticket,
          hours_logged: hoursLogged,
          equity_earned: equityEarned,
          assigneeDetails
        };
      }));
      
      setTickets(processedTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const organizeTicketsByStatus = () => {
    const newMap: {[key: string]: any[]} = {
      'new': [],
      'in-progress': [],
      'review': [],
      'done': [],
      'blocked': []
    };
    
    tickets.forEach(ticket => {
      if (newMap[ticket.status]) {
        newMap[ticket.status].push(ticket);
      } else {
        newMap['new'].push(ticket);
      }
    });
    
    setTicketsMap(newMap);
  };

  const calculateMetrics = () => {
    const open = tickets.filter(t => ['new', 'in-progress', 'review'].includes(t.status)).length;
    const closed = tickets.filter(t => ['done', 'closed'].includes(t.status)).length;
    const highPriority = tickets.filter(t => t.priority === 'high').length;
    
    setTicketMetrics({
      total: tickets.length,
      open,
      closed,
      highPriority
    });
  };

  const handleCreateTicket = async () => {
    if (!selectedProject || !newTicket.title) return;
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          status: 'new',
          health: 'green',
          reporter: businessId,
          project_id: selectedProject,
          ticket_type: newTicket.type
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Beta testing ticket created successfully");
      setIsCreateDialogOpen(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        type: 'beta-test'
      });
      
      loadTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      if (newStatus === 'review') {
        const ticketToReview = tickets.find(t => t.id === ticketId);
        if (ticketToReview) {
          setSelectedTask(ticketToReview);
          setIsCompletionReviewOpen(true);
          return;
        }
      }
      
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      
      toast.success(`Ticket status updated to ${newStatus}`);
      
      loadTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      
      toast.success(`Ticket priority updated to ${newPriority}`);
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleAssigneeChange = async (ticketId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: userId || null })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, assigned_to: userId || null } : ticket
      ));
      
      toast.success(userId ? "Ticket assigned successfully" : "Ticket unassigned");
    } catch (error) {
      console.error("Error updating ticket assignee:", error);
      toast.error("Failed to update ticket assignee");
    }
  };

  const handleTicketReply = async (ticketId: string, message: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;
      
      const replies = ticket.replies || [];
      const newReply = {
        id: Math.random().toString(36).substring(2, 9),
        content: message,
        createdAt: new Date().toISOString(),
        sender: {
          id: businessId,
          name: "You"
        }
      };
      
      const { error } = await supabase
        .from('tickets')
        .update({ 
          replies: [...replies, newReply],
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, replies: [...(ticket.replies || []), newReply] } 
          : ticket
      ));
      
      toast.success("Reply sent successfully");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  const toggleTicketExpansion = (ticketId: string) => {
    console.info("Toggle ticket:", ticketId, "expanded:", expandedTicket === ticketId ? "false" : "true");
    setExpandedTicket(prev => prev === ticketId ? null : ticketId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'done':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleRefresh = () => {
    loadTickets();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Beta Testing</CardTitle>
              <p className="text-sm text-muted-foreground">Manage beta testing tickets for your projects</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowKanban(!showKanban)}>
                {showKanban ? 'Hide Kanban' : 'Show Kanban'}
                <KanbanSquare className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowGantt(!showGantt)}>
                {showGantt ? 'Hide Gantt' : 'Show Gantt'}
                <BarChart2 className="h-4 w-4 ml-1" />
              </Button>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading beta testing tickets...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You don't have any projects yet. Create a project first.
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <Select
                  value={selectedProject || ''}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.project_id} value={project.project_id}>
                        {project.title || 'Untitled Project'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProject && (
                <div>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="all">All Tickets</TabsTrigger>
                      <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
                      <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
                      <TabsTrigger value="beta-testing">Beta Testing Tickets</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                          <p className="text-2xl font-bold">{ticketMetrics.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-amber-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                          <p className="text-2xl font-bold">{ticketMetrics.open}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Closed Tickets</p>
                          <p className="text-2xl font-bold">{ticketMetrics.closed}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                          <p className="text-2xl font-bold">{ticketMetrics.highPriority}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-slate-100 p-4 rounded-lg mb-4 flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-2 items-center">
                        <Label htmlFor="status-filter">Status:</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger id="status-filter" className="w-[150px]">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Label htmlFor="priority-filter">Priority:</Label>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                          <SelectTrigger id="priority-filter" className="w-[150px]">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  
                  {showKanban && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
                      {['new', 'in-progress', 'review', 'done', 'blocked'].map(status => (
                        <div key={status} className="min-w-[250px]">
                          <h3 className="font-medium mb-2 capitalize">{status.replace('-', ' ')} ({ticketsMap[status]?.length || 0})</h3>
                          <div className="space-y-3 min-h-[200px]">
                            {ticketsMap[status]?.map(ticket => (
                              <Card key={ticket.id} className="p-3 border-l-4" 
                                style={{ borderLeftColor: ticket.priority === 'high' ? '#ef4444' : ticket.priority === 'medium' ? '#f59e0b' : '#22c55e' }}>
                                <div className="text-sm font-medium">{ticket.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{ticket.description}</div>
                                <div className="flex justify-between items-center mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {ticket.ticket_type || 'task'}
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => toggleTicketExpansion(ticket.id)}>
                                    View
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showGantt && (
                    <div className="p-4 text-center border rounded-lg mt-4">
                      <p className="text-muted-foreground">Gantt chart view will be implemented soon.</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-slate-50"
                          onClick={() => toggleTicketExpansion(ticket.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{ticket.title}</h3>
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {ticket.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm flex items-center space-x-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{ticket.hours_logged || 0}h logged</span>
                              </div>
                              <div className="text-sm flex items-center space-x-1 text-muted-foreground">
                                <ProgressCircle value={ticket.completion_percentage || 0} size="xs" strokeWidth={3} />
                                <span>{ticket.completion_percentage || 0}%</span>
                              </div>
                              <div className="text-sm flex items-center space-x-1 text-muted-foreground">
                                <span>{((ticket.equity_points || 0) * (ticket.completion_percentage || 0) / 100).toFixed(2)}% earned</span>
                              </div>
                              <div className="flex gap-1">
                                <Badge className={getStatusColor(ticket.status)}>
                                  {getStatusIcon(ticket.status)}
                                  <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                                </Badge>
                                <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
                                  {ticket.priority}
                                </Badge>
                              </div>
                              <Button variant="outline" size="sm">
                                {expandedTicket === ticket.id ? 'Collapse' : 'Expand'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {expandedTicket === ticket.id && (
                          <div className="p-4 border-t bg-slate-50">
                            <ExpandedTicketDetails 
                              ticket={{
                                ...ticket,
                                hours_logged: ticket.hours_logged || 0,
                                equity_earned: (ticket.equity_points || 0) * (ticket.completion_percentage || 0) / 100
                              }}
                              onTicketAction={handleTicketAction}
                              userCanEditStatus={true}
                              userCanEditDates={true}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Beta Testing Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                placeholder="Enter ticket title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                placeholder="Describe the issue or feature to test"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
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
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Ticket Type</Label>
              <Select
                value={newTicket.type}
                onValueChange={(value) => setNewTicket({...newTicket, type: value})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beta-test">Beta Test</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={!newTicket.title}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedTask && (
        <TaskCompletionReview 
          businessId={businessId}
          task={selectedTask}
          open={isCompletionReviewOpen}
          setOpen={setIsCompletionReviewOpen}
          onClose={() => {
            setSelectedTask(null);
            loadTickets();
          }}
        />
      )}
    </div>
  );
};
