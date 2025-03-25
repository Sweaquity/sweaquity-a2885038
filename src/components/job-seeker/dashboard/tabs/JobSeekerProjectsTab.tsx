import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, CheckCircle2, AlertTriangle, FileText, ArrowUpToLine, Plus, RefreshCw, KanbanSquare, BarChart2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExpandedTicketDetails } from "@/components/ticket/ExpandedTicketDetails";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsMap, setTicketsMap] = useState<{[key: string]: any[]}>({
    'new': [],
    'in-progress': [],
    'review': [],
    'done': [],
    'blocked': []
  });
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [ticketMetrics, setTicketMetrics] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [logHours, setLogHours] = useState<number>(0);
  const [logDescription, setLogDescription] = useState<string>('');
  const [currentLogTicket, setCurrentLogTicket] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadUserProjects();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedProject) {
      loadTickets(selectedProject);
    }
  }, [selectedProject, statusFilter, priorityFilter]);

  useEffect(() => {
    if (tickets.length > 0) {
      organizeTicketsByStatus();
      calculateMetrics();
    }
  }, [tickets]);

  const loadUserProjects = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select(`
          job_app_id,
          project_id,
          status,
          accepted_business,
          accepted_jobseeker,
          task_id
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .is('accepted_business', true)
        .is('accepted_jobseeker', true);
      
      if (appError) throw appError;
      
      if (!applications || applications.length === 0) {
        setLoading(false);
        return;
      }
      
      const projectIds = applications.map(app => app.project_id).filter(Boolean);
      
      if (projectIds.length === 0) {
        setLoading(false);
        return;
      }
      
      const { data: projects, error: projectError } = await supabase
        .from('business_projects')
        .select(`
          *,
          businesses (
            company_name
          )
        `)
        .in('project_id', projectIds);
      
      if (projectError) throw projectError;
      
      setUserProjects(projects || []);
      
      if (projects && projects.length > 0) {
        setSelectedProject(projects[0].project_id);
      }
      
    } catch (error) {
      console.error("Error loading user projects:", error);
      toast.error("Failed to load your projects");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (projectId: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          time_entries (
            id,
            description,
            start_time,
            end_time,
            hours_logged
          )
        `)
        .eq('project_id', projectId);
      
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
      
      const processedTickets = data?.map(ticket => {
        const hoursLogged = ticket.time_entries?.reduce((total: number, entry: any) => {
          return total + (entry.hours_logged || 0);
        }, 0) || 0;
        
        const equityEarned = ticket.equity_points * (ticket.completion_percentage / 100);
        
        return {
          ...ticket,
          hours_logged: hoursLogged,
          equity_earned: equityEarned
        };
      }) || [];
      
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

  const toggleTicketExpansion = useCallback((ticketId: string) => {
    console.info("Toggle ticket:", ticketId, "expanded:", expandedTicket === ticketId ? "false" : "true");
    setExpandedTicket(prev => prev === ticketId ? null : ticketId);
    
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket || null);
  }, [expandedTicket, tickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      
      toast.success(`Ticket status updated to ${newStatus}`);
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
          id: userId,
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
    if (selectedProject) {
      loadTickets(selectedProject);
    }
  };

  const handleCreateTicket = () => {
    toast.info("Create ticket functionality not implemented yet");
  };

  const openTimeLogDialog = (ticket: any) => {
    setCurrentLogTicket(ticket);
    setIsTimeLogDialogOpen(true);
  };

  const handleLogTime = async () => {
    if (!currentLogTicket || !userId || logHours <= 0 || !logDescription.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: currentLogTicket.id,
          user_id: userId,
          description: logDescription,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + logHours * 60 * 60 * 1000).toISOString(),
          hours_logged: logHours
        });
      
      if (error) throw error;
      
      toast.success("Time logged successfully");
      setIsTimeLogDialogOpen(false);
      setLogHours(0);
      setLogDescription('');
      
      if (selectedProject) {
        loadTickets(selectedProject);
      }
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    }
  };

  const handleUpdateEstimatedHours = async (ticketId: string, hours: number) => {
    try {
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ estimated_hours: hours })
        .eq('id', ticketId);
        
      if (ticketError) throw ticketError;
      
      // Also update jobseeker_active_projects if this is a task
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket?.task_id) {
        await supabase
          .from('jobseeker_active_projects')
          .update({ estimated_hours: hours })
          .eq('task_id', ticket.task_id);
      }
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, estimated_hours: hours } : t
      ));
      
      toast.success("Estimated hours updated successfully");
    } catch (error) {
      console.error("Error updating estimated hours:", error);
      toast.error("Failed to update estimated hours");
    }
  };

  const handleUpdateCompletionPercentage = async (ticketId: string, percentage: number) => {
    try {
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ completion_percentage: percentage })
        .eq('id', ticketId);
        
      if (ticketError) throw ticketError;
      
      // Also update jobseeker_active_projects if this is a task
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket?.task_id) {
        await supabase
          .from('jobseeker_active_projects')
          .update({ completion_percentage: percentage })
          .eq('task_id', ticket.task_id);
      }
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, completion_percentage: percentage } : t
      ));
      
      toast.success("Completion percentage updated successfully");
    } catch (error) {
      console.error("Error updating completion percentage:", error);
      toast.error("Failed to update completion percentage");
    }
  };

  const renderProjectSelector = () => (
    <Select
      value={selectedProject || ''}
      onValueChange={setSelectedProject}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {userProjects.map(project => (
          <SelectItem key={project.project_id} value={project.project_id}>
            {project.title || 'Untitled Project'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderTicketTabs = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="all">All Tickets</TabsTrigger>
        <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
        <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
        <TabsTrigger value="beta-testing">Beta Testing Tickets</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const renderMetricsCards = () => (
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
  );

  const renderKanbanBoard = () => (
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
                  <div className="text-xs">{ticket.completion_percentage || 0}%</div>
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
  );

  const renderTicketList = () => (
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
                  <span>{ticket.completion_percentage || 0}%</span>
                </div>
                <div className="text-sm flex items-center space-x-1 text-muted-foreground">
                  <span>{((ticket.equity_points || 0) * (ticket.completion_percentage || 0) / 100).toFixed(1)}% earned</span>
                </div>
                <div className="flex gap-1">
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                  </Badge>
                  <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
                    {ticket.priority}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    openTimeLogDialog(ticket);
                  }}>
                    <Clock className="h-4 w-4 mr-1" />
                    Log Time
                  </Button>
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
                  hours_logged_total: ticket.hours_logged,
                  equity_earned: parseFloat(((ticket.equity_points || 0) * (ticket.completion_percentage || 0) / 100).toFixed(1))
                }}
                messages={ticket.replies?.map((reply: any) => ({
                  id: reply.id,
                  message: reply.content,
                  sender: reply.sender,
                  createdAt: reply.createdAt
                })) || []}
                onReply={(message) => handleTicketReply(ticket.id, message)}
                onStatusChange={(status) => handleStatusChange(ticket.id, status)}
                onPriorityChange={(priority) => handlePriorityChange(ticket.id, priority)}
                onUpdateEstimatedHours={(hours) => handleUpdateEstimatedHours(ticket.id, hours)}
                onUpdateCompletionPercentage={(percentage) => handleUpdateCompletionPercentage(ticket.id, percentage)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFilters = () => (
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
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Projects</CardTitle>
              <p className="text-sm text-muted-foreground">View and manage your project tasks</p>
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
              <Button size="sm" onClick={handleCreateTicket}>
                <Plus className="h-4 w-4 mr-1" />
                Create Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading projects and tickets...</div>
          ) : userProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You don't have any projects yet.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                {renderProjectSelector()}
              </div>
              
              {selectedProject && (
                <div>
                  {renderTicketTabs()}
                  {renderMetricsCards()}
                  {renderFilters()}
                  
                  {showKanban && renderKanbanBoard()}
                  
                  {showGantt && (
                    <div className="p-4 text-center border rounded-lg mt-4">
                      <p className="text-muted-foreground">Gantt chart view will be implemented soon using the created date and due date from jobseeker_active_projects.</p>
                    </div>
                  )}
                  
                  {renderTicketList()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Log Time for {currentLogTicket?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                step="0.5"
                value={logHours || ''}
                onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description of Work</Label>
              <Textarea
                id="description"
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                placeholder="Describe what you accomplished during this time"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogTime} disabled={logHours <= 0 || !logDescription.trim()}>
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
