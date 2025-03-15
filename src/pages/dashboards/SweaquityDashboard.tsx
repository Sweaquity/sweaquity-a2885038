
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { KanbanBoard } from "@/components/business/testing/KanbanBoard";
import { TestingTab } from "@/components/business/testing/TestingTab";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, AlertCircle, Clock, PieChart, BarChart3, Calendar, Users, Briefcase, User, GitPullRequest } from "lucide-react";
import { toast } from "sonner";

const SweaquityDashboard = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState("dashboard");
  const [betaTickets, setBetaTickets] = useState([]);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    jobSeekers: 0,
    businesses: 0,
    recruiters: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchBetaTickets(),
          fetchProjectStats(),
          fetchUserStats()
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch beta tickets from the database
  const fetchBetaTickets = async () => {
    try {
      // Fix the query to explicitly join the profiles table
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          reporter_email:profiles!tickets_reporter_fkey(email)
        `)
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching beta tickets:", error);
        return;
      }

      setBetaTickets(data || []);
    } catch (error) {
      console.error("Error fetching beta tickets:", error);
    }
  };

  // Fetch project statistics
  const fetchProjectStats = async () => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .select('status');

      if (error) throw error;

      const total = data.length;
      const active = data.filter(p => p.status === 'active').length;
      const completed = data.filter(p => p.status === 'completed').length;

      setProjectStats({ total, active, completed });
    } catch (error) {
      console.error("Error fetching project stats:", error);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      // This would need to be implemented via a serverless function 
      // with admin rights or using aggregate SQL functions
      // For now, we'll use placeholder data
      setUserStats({
        total: 250,
        jobSeekers: 150,
        businesses: 75,
        recruiters: 25
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Create a new ticket
  const createNewTicket = async () => {
    try {
      // Get the current user's ID (in a real app, this would be the authenticated user)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to create tickets");
        return;
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: ticketTitle,
          description: ticketDescription,
          priority: ticketPriority,
          status: 'open',
          reporter: session.user.id
        })
        .select();

      if (error) throw error;
      
      // Add the new ticket to the local state
      setBetaTickets(prev => [data[0], ...prev]);
      
      // Reset form and close dialog
      setTicketTitle('');
      setTicketDescription('');
      setTicketPriority('medium');
      setShowCreateDialog(false);
      
      toast.success("Ticket created successfully");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  // Transform tickets for Gantt chart
  const ganttTickets = useMemo(() => {
    return betaTickets.map(ticket => {
      // Set reasonable start and end dates
      const startDate = new Date(ticket.created_at || new Date());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7); // Default to 7-day timeline
      
      return {
        id: ticket.id,
        task: ticket.title,
        start: startDate,
        end: endDate,
        progress: ticket.status === 'done' ? 100 : ticket.status === 'in_progress' ? 50 : 0,
        type: ticket.priority,
        project: "Beta Testing"
      };
    });
  }, [betaTickets]);

  // Maps for status and priority colors
  const statusColorMap = {
    'open': 'bg-blue-500',
    'in_progress': 'bg-yellow-500',
    'review': 'bg-purple-500',
    'done': 'bg-green-500'
  };

  const priorityColorMap = {
    'low': 'bg-blue-100 text-blue-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sweaquity Admin Dashboard</h1>
        <div>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Ticket
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="beta-tickets">Beta Tickets</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Overview Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Across all user types
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-blue-500" />
                      Job Seekers
                    </span>
                    <span>{userStats.jobSeekers}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1 text-green-500" />
                      Businesses
                    </span>
                    <span>{userStats.businesses}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-purple-500" />
                      Recruiters
                    </span>
                    <span>{userStats.recruiters}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Project Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.total}</div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Active</span>
                    <span>{projectStats.active}</span>
                  </div>
                  <Progress value={(projectStats.active / projectStats.total) * 100} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>Completed</span>
                    <span>{projectStats.completed}</span>
                  </div>
                  <Progress value={(projectStats.completed / projectStats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            {/* Platform Health Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-500 font-medium">All Systems Operational</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>API Response</span>
                    <span className="text-green-500">98.7% uptime</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Database</span>
                    <span className="text-green-500">99.9% uptime</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Storage</span>
                    <span className="text-green-500">99.5% uptime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Beta Testing Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Beta Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{betaTickets.length} issues</div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Open</span>
                    <span>{betaTickets.filter(t => t.status === 'open').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>In Progress</span>
                    <span>{betaTickets.filter(t => t.status === 'in_progress').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Resolved</span>
                    <span>{betaTickets.filter(t => t.status === 'done').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Beta Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Beta Testing Issues</CardTitle>
              <CardDescription>The latest reported issues from beta testers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {betaTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${statusColorMap[ticket.status] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">{ticket.title}</h4>
                        <Badge variant="outline" className={priorityColorMap[ticket.priority] || 'bg-gray-100'}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ticket.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.reporter_email?.[0]?.email || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {betaTickets.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No beta tickets found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Beta Tickets Tab */}
        <TabsContent value="beta-tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Beta Testing Issues</CardTitle>
              <CardDescription>All reported issues from beta testers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gantt Chart for issues */}
                <GanttChartView tasks={ganttTickets} />
                
                {/* Table of all issues */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">All Issues</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted/50 p-3">
                      <div className="col-span-5 font-medium">Title</div>
                      <div className="col-span-2 font-medium">Status</div>
                      <div className="col-span-2 font-medium">Priority</div>
                      <div className="col-span-3 font-medium">Reporter</div>
                    </div>
                    {betaTickets.map((ticket) => (
                      <div key={ticket.id} className="grid grid-cols-12 p-3 border-t">
                        <div className="col-span-5">{ticket.title}</div>
                        <div className="col-span-2">
                          <Badge variant="outline" className={`${statusColorMap[ticket.status]} bg-opacity-20`}>
                            {ticket.status === 'in_progress' ? 'In Progress' : 
                             ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline" className={priorityColorMap[ticket.priority]}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </Badge>
                        </div>
                        <div className="col-span-3 truncate">
                          {ticket.reporter_email?.[0]?.email || 'Unknown'}
                        </div>
                      </div>
                    ))}
                    {betaTickets.length === 0 && (
                      <div className="p-4 text-center text-gray-500">No beta tickets found</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Testing Tab */}
        <TabsContent value="testing">
          <TestingTab />
        </TabsContent>
      </Tabs>
      
      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Beta Test Ticket</DialogTitle>
            <DialogDescription>
              Report a new issue or feature request for beta testing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ticket-title" className="text-sm font-medium">Title</label>
              <Input
                id="ticket-title"
                placeholder="Enter ticket title"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="ticket-description" className="text-sm font-medium">Description</label>
              <textarea
                id="ticket-description"
                className="w-full h-32 px-3 py-2 border rounded-md resize-none"
                placeholder="Describe the issue or feature request"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="ticket-priority" className="text-sm font-medium">Priority</label>
              <select
                id="ticket-priority"
                className="w-full px-3 py-2 border rounded-md"
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createNewTicket} disabled={!ticketTitle.trim()}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SweaquityDashboard;
