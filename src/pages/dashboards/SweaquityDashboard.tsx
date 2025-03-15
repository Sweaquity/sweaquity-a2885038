import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChartView } from "@/components/business/testing/GanttChartView";

// Update the BetaTicket interface to include the new properties

interface BetaTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  reporter_email?: string;
  reporter?: string;
  // New properties
  expanded?: boolean;        // UI state for expanding/collapsing tickets
  newNote?: string;          // Temporary state for new notes
  activity?: Array<{         // Activity timeline
    action: string;
    user: string;
    timestamp: string;
    comment?: string;
  }>;
  system_info?: {            // System information
    url: string;
    userAgent: string;
    timestamp: string;
    viewportSize: string;
    referrer: string;
  };
  reported_url?: string;     // URL where the issue was found
  attachments?: string[];    // Screenshot URLs
  reproduction_steps?: string; // Steps to reproduce the issue
}

interface StatisticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

const SweaquityDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
// Add these new functions to the SweaquityDashboard component

// Add these new state variables
const [replyDialogOpen, setReplyDialogOpen] = useState(false);
const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
const [replyMessage, setReplyMessage] = useState('');

// Handler functions for ticket actions
const handleAddTicketNote = async (ticketId: string, note: string) => {
  if (!note.trim()) return;
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to add notes");
      return;
    }
    
    // Get user's email or name
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : userData?.email || user.email || 'Unknown User';
    
    // First, fetch current ticket data
    const { data: ticketData, error: fetchError } = await supabase
      .from('tickets')
      .select('activity')
      .eq('id', ticketId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      toast.error("Failed to add note");
      return;
    }
    
    // Prepare activity array
    let activity = ticketData.activity || [];
    
    // Add new activity
    activity.push({
      action: 'Note added',
      user: userName,
      timestamp: new Date().toISOString(),
      comment: note
    });
    
    // Update the ticket with new activity
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        activity: activity,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
      
    if (updateError) {
      console.error("Error updating ticket:", updateError);
      toast.error("Failed to add note");
      return;
    }
    
    // Clear the note input
    setBetaTickets(prev => prev.map(t => 
      t.id === ticketId ? {...t, newNote: ''} : t
    ));
    
    // Refresh the ticket data
    await fetchBetaTickets();
    toast.success("Note added successfully");
    
  } catch (err) {
    console.error("Error in handleAddTicketNote:", err);
    toast.error("Failed to add note");
  }
};

      // Add this Dialog component at the bottom of the SweaquityDashboard component return

        {/* Reply to Reporter Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reply to Ticket Reporter</DialogTitle>
              <DialogDescription>
                Send a message to the person who reported this issue
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {activeTicketId && (
                <div className="space-y-2">
                  <Label htmlFor="reply-message">Message</Label>
                  <Textarea
                    id="reply-message"
                    placeholder="Enter your response..."
                    rows={5}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendReplyToReporter}
                disabled={!replyMessage.trim()}
              >
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to update ticket status");
      return;
    }
    
    // Get user's email or name
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : userData?.email || user.email || 'Unknown User';
    
    // First, fetch current ticket data
    const { data: ticketData, error: fetchError } = await supabase
      .from('tickets')
      .select('activity, status')
      .eq('id', ticketId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      toast.error("Failed to update status");
      return;
    }
    
    // Prepare activity array
    let activity = ticketData.activity || [];
    
    // Add new activity
    activity.push({
      action: `Status changed from ${ticketData.status} to ${status}`,
      user: userName,
      timestamp: new Date().toISOString()
    });
    
    // Update the ticket with new status and activity
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: status,
        activity: activity,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
      
    if (updateError) {
      console.error("Error updating ticket status:", updateError);
      toast.error("Failed to update status");
      return;
    }
    
    // Refresh the ticket data
    await fetchBetaTickets();
    toast.success("Status updated successfully");
    
  } catch (err) {
    console.error("Error in handleUpdateTicketStatus:", err);
    toast.error("Failed to update status");
  }
};

const handleUpdateTicketPriority = async (ticketId: string, priority: string) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to update ticket priority");
      return;
    }
    
    // Get user's email or name
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : userData?.email || user.email || 'Unknown User';
    
    // First, fetch current ticket data
    const { data: ticketData, error: fetchError } = await supabase
      .from('tickets')
      .select('activity, priority')
      .eq('id', ticketId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      toast.error("Failed to update priority");
      return;
    }
    
    // Prepare activity array
    let activity = ticketData.activity || [];
    
    // Add new activity
    activity.push({
      action: `Priority changed from ${ticketData.priority} to ${priority}`,
      user: userName,
      timestamp: new Date().toISOString()
    });
    
    // Update the ticket with new priority and activity
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        priority: priority,
        activity: activity,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
      
    if (updateError) {
      console.error("Error updating ticket priority:", updateError);
      toast.error("Failed to update priority");
      return;
    }
    
    // Refresh the ticket data
    await fetchBetaTickets();
    toast.success("Priority updated successfully");
    
  } catch (err) {
    console.error("Error in handleUpdateTicketPriority:", err);
    toast.error("Failed to update priority");
  }
};

const handleReplyToReporter = (ticketId: string) => {
  setActiveTicketId(ticketId);
  setReplyMessage('');
  setReplyDialogOpen(true);
};

const sendReplyToReporter = async () => {
  if (!activeTicketId || !replyMessage.trim()) return;
  
  try {
    // Find the active ticket
    const ticket = betaTickets.find(t => t.id === activeTicketId);
    if (!ticket || !ticket.reporter) {
      toast.error("Cannot find reporter information");
      return;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }
    
    // Get user's email or name
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : userData?.email || user.email || 'Unknown User';
    
    // Create a notification/message in the database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: ticket.reporter,
        subject: `Re: ${ticket.title}`,
        message: replyMessage,
        related_ticket: activeTicketId,
        read: false
      });
      
    if (messageError) {
      console.error("Error sending message:", messageError);
      toast.error("Failed to send reply");
      return;
    }
    
    // Update ticket activity
    // First, fetch current ticket data
    const { data: ticketData, error: fetchError } = await supabase
      .from('tickets')
      .select('activity')
      .eq('id', activeTicketId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      // Still continue, because the message was sent
    } else {
      // Prepare activity array
      let activity = ticketData.activity || [];
      
      // Add new activity
      activity.push({
        action: 'Reply sent to reporter',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: replyMessage
      });
      
      // Update the ticket with new activity
      await supabase
        .from('tickets')
        .update({
          activity: activity,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTicketId);
    }
    
    // Close dialog and refresh
    setReplyDialogOpen(false);
    setActiveTicketId(null);
    setReplyMessage('');
    await fetchBetaTickets();
    toast.success("Reply sent successfully");
    
  } catch (err) {
    console.error("Error in sendReplyToReporter:", err);
    toast.error("Failed to send reply");
  }
};

const handleSetDueDate = async (ticketId: string, dueDateStr: string) => {
  if (!dueDateStr) return;
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to set due date");
      return;
    }
    
    // Get user's email or name
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();
      
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : userData?.email || user.email || 'Unknown User';
    
    // First, fetch current ticket data
    const { data: ticketData, error: fetchError } = await supabase
      .from('tickets')
      .select('activity, due_date')
      .eq('id', ticketId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching ticket:", fetchError);
      toast.error("Failed to set due date");
      return;
    }
    
    // Format the dates for activity log
    const oldDueDate = ticketData.due_date ? new Date(ticketData.due_date).toLocaleDateString() : 'None';
    const newDueDate = new Date(dueDateStr).toLocaleDateString();
    
    // Prepare activity array
    let activity = ticketData.activity || [];
    
    // Add new activity
    activity.push({
      action: `Due date changed from ${oldDueDate} to ${newDueDate}`,
      user: userName,
      timestamp: new Date().toISOString()
    });
    
    // Update the ticket with new due date and activity
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        due_date: new Date(dueDateStr).toISOString(),
        activity: activity,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
      
    if (updateError) {
      console.error("Error updating due date:", updateError);
      toast.error("Failed to set due date");
      return;
    }
    
    // Refresh the ticket data
    await fetchBetaTickets();
    toast.success("Due date set successfully");
    
  } catch (err) {
    console.error("Error in handleSetDueDate:", err);
    toast.error("Failed to set due date");
  }
};


  
  // Platform stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalProjects: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    withdrawnApplications: 0,
    rejectedApplications: 0,
    openTasks: 0,
    completedTasks: 0
  });
  
  // Ticket stats
  const [ticketStats, setTicketStats] = useState<StatisticsData>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchBetaTickets()
    ]);
    setIsLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from Supabase
      const fetchUsersCount = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
        
      const fetchBusinessesCount = supabase
        .from('businesses')
        .select('businesses_id', { count: 'exact', head: true });
        
      const fetchProjectsCount = supabase
        .from('business_projects')
        .select('project_id', { count: 'exact', head: true });
        
      const fetchApplicationsCount = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true });
        
      const fetchPendingApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      const fetchAcceptedApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'accepted');
        
      const fetchWithdrawnApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'withdrawn');
        
      const fetchRejectedApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'rejected');
        
      const fetchOpenTasks = supabase
        .from('project_sub_tasks')
        .select('task_id', { count: 'exact', head: true })
        .eq('status', 'open');
        
      const fetchCompletedTasks = supabase
        .from('project_sub_tasks')
        .select('task_id', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      // Execute all queries in parallel
      const [
        usersResult,
        businessesResult,
        projectsResult,
        applicationsResult,
        pendingAppsResult,
        acceptedAppsResult,
        withdrawnAppsResult,
        rejectedAppsResult,
        openTasksResult,
        completedTasksResult
      ] = await Promise.all([
        fetchUsersCount,
        fetchBusinessesCount,
        fetchProjectsCount,
        fetchApplicationsCount,
        fetchPendingApplications,
        fetchAcceptedApplications,
        fetchWithdrawnApplications,
        fetchRejectedApplications,
        fetchOpenTasks,
        fetchCompletedTasks
      ]);
      
      // Check for errors
      if (usersResult.error || businessesResult.error || projectsResult.error || applicationsResult.error) {
        throw new Error("Error fetching data");
      }
      
      // Update stats with counts
      setStats({
        totalUsers: usersResult.count || 0,
        totalBusinesses: businessesResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        pendingApplications: pendingAppsResult.count || 0,
        acceptedApplications: acceptedAppsResult.count || 0,
        withdrawnApplications: withdrawnAppsResult.count || 0,
        rejectedApplications: rejectedAppsResult.count || 0,
        openTasks: openTasksResult.count || 0,
        completedTasks: completedTasksResult.count || 0
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const fetchBetaTickets = async () => {
    try {
      // First fetch tickets without the profiles join
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching beta tickets:", error);
        toast.error("Failed to load beta tickets");
        return;
      }

      // Then get the reporter emails separately
      const processedTickets = await Promise.all(
        data.map(async (ticket) => {
          let reporterEmail = null;
          
          if (ticket.reporter) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', ticket.reporter)
              .maybeSingle();
              
            reporterEmail = profileData?.email;
          }
          
          return {
            ...ticket,
            reporter_email: reporterEmail
          };
        })
      );

      setBetaTickets(processedTickets);
      calculateTicketStatistics(processedTickets);
    } catch (err) {
      console.error("Error in fetchBetaTickets:", err);
      toast.error("Failed to load beta tickets data");
    }
  };

  const calculateTicketStatistics = (tickets: BetaTicket[]) => {
    const stats: StatisticsData = {
      totalTickets: tickets.length,
      openTickets: 0,
      closedTickets: 0,
      highPriorityTickets: 0,
      byStatus: {},
      byPriority: {}
    };

    tickets.forEach(ticket => {
      // Count by status
      if (ticket.status === 'done' || ticket.status === 'closed') {
        stats.closedTickets++;
      } else {
        stats.openTickets++;
      }

      // Count by priority
      if (ticket.priority === 'high') {
        stats.highPriorityTickets++;
      }

      // Aggregate by status
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;

      // Aggregate by priority
      stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
    });

    setTicketStats(stats);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const handleRefreshData = () => {
    fetchAllData();
    toast.success("Dashboard data refreshed");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sweaquity Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform management and beta testing</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Platform Overview</TabsTrigger>
          <TabsTrigger value="tickets">Beta Testing</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={<Users className="h-8 w-8 text-blue-500" />} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Businesses" 
              value={stats.totalBusinesses} 
              icon={<Building className="h-8 w-8 text-purple-500" />} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Projects" 
              value={stats.totalProjects} 
              icon={<Briefcase className="h-8 w-8 text-green-500" />} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Applications" 
              value={stats.totalApplications} 
              icon={<FileText className="h-8 w-8 text-amber-500" />} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion</CardTitle>
                <CardDescription>Status of all project tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-pulse bg-muted h-40 w-full rounded-md"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Open Tasks</p>
                        <p className="text-3xl font-bold">{stats.openTasks}</p>
                      </div>
                      <Clock className="h-10 w-10 text-amber-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Completed Tasks</p>
                        <p className="text-3xl font-bold">{stats.completedTasks}</p>
                      </div>
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {stats.openTasks + stats.completedTasks > 0 
                          ? `${Math.round((stats.completedTasks / (stats.openTasks + stats.completedTasks)) * 100)}%` 
                          : '0%'
                        }
                      </p>
                      <div className="w-full h-3 bg-gray-200 rounded-full mt-2">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ 
                            width: `${stats.openTasks + stats.completedTasks > 0 
                              ? Math.round((stats.completedTasks / (stats.openTasks + stats.completedTasks)) * 100)
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Beta Testing Status</CardTitle>
                <CardDescription>Overview of beta tickets and issues</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  // This code should replace the existing betaTickets map section in the "tickets" TabsContent
// found in paste.txt around line 361-384

                      <div className="space-y-4">
                      {betaTickets.map(ticket => (
                        <Card key={ticket.id} className="overflow-hidden">
                          <div className="border-b px-4 py-3 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center">
                              <h3 className="font-medium">{ticket.title}</h3>
                              <div className="flex space-x-2 ml-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {ticket.priority}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  ticket.status === 'done' || ticket.status === 'closed' ? 'bg-green-100 text-green-800' : 
                                  ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.status}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Toggle expanded state for this ticket
                                setBetaTickets(prev => prev.map(t => 
                                  t.id === ticket.id ? {...t, expanded: !t.expanded} : t
                                ));
                              }}
                            >
                              {ticket.expanded ? "Collapse" : "Expand"}
                            </Button>
                          </div>
                          
                          {/* Collapsible content */}
                          {ticket.expanded && (
                            <div className="p-4">
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Created: </span>
                                      {formatDate(ticket.created_at)}
                                    </div>
                                    {ticket.due_date && (
                                      <div>
                                        <span className="text-gray-500">Due: </span>
                                        {formatDate(ticket.due_date)}
                                      </div>
                                    )}
                                    {ticket.reporter_email && (
                                      <div>
                                        <span className="text-gray-500">Reporter: </span>
                                        {ticket.reporter_email}
                                      </div>
                                    )}
                                    {ticket.reported_url && (
                                      <div>
                                        <span className="text-gray-500">URL: </span>
                                        <span className="text-blue-500 underline">{ticket.reported_url}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* System info display */}
                                  {ticket.system_info && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                      <p className="font-medium mb-1">System Info:</p>
                                      <div className="grid grid-cols-2 gap-1">
                                        <div><span className="text-gray-500">Browser: </span>{ticket.system_info.userAgent}</div>
                                        <div><span className="text-gray-500">Screen: </span>{ticket.system_info.viewportSize}</div>
                                        <div><span className="text-gray-500">Time: </span>{new Date(ticket.system_info.timestamp).toLocaleString()}</div>
                                        <div><span className="text-gray-500">Referrer: </span>{ticket.system_info.referrer}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Screenshots gallery */}
                                {ticket.attachments && ticket.attachments.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Screenshots ({ticket.attachments.length})</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {ticket.attachments.map((url, i) => (
                                        <div key={i} className="relative group border rounded overflow-hidden h-36">
                                          <img 
                                            src={url} 
                                            alt={`Screenshot ${i+1}`} 
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="text-white"
                                              onClick={() => window.open(url, '_blank')}
                                            >
                                              View Full
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Ticket timeline */}
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
                                <div className="space-y-2 text-sm pl-4 border-l-2 border-gray-200">
                                  {/* Render timeline from ticket comments/activity logs */}
                                  {ticket.activity ? (
                                    ticket.activity.map((activity, index) => (
                                      <div key={index} className="relative pl-4 pb-2">
                                        <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px]"></div>
                                        <p className="font-medium">{activity.action}</p>
                                        <p className="text-gray-500 text-xs">{new Date(activity.timestamp).toLocaleString()} by {activity.user}</p>
                                        {activity.comment && <p className="mt-1">{activity.comment}</p>}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="py-2 text-gray-500">No activity recorded yet</div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="border-t pt-4 space-y-4">
                                <div>
                                  <Label htmlFor={`note-${ticket.id}`}>Add Note</Label>
                                  <div className="flex gap-2 mt-1">
                                    <Textarea 
                                      id={`note-${ticket.id}`} 
                                      placeholder="Add a note or update..." 
                                      className="flex-1"
                                      value={ticket.newNote || ''}
                                      onChange={(e) => {
                                        setBetaTickets(prev => prev.map(t => 
                                          t.id === ticket.id ? {...t, newNote: e.target.value} : t
                                        ));
                                      }}
                                    />
                                    <Button 
                                      variant="secondary"
                                      disabled={!ticket.newNote?.trim()}
                                      onClick={() => {
                                        handleAddTicketNote(ticket.id, ticket.newNote || '');
                                      }}
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  <Select 
                                    value={ticket.status}
                                    onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="waiting">Waiting for Info</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select 
                                    value={ticket.priority}
                                    onValueChange={(value) => handleUpdateTicketPriority(ticket.id, value)}
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue placeholder="Update Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleReplyToReporter(ticket.id)}
                                    disabled={!ticket.reporter_email}
                                  >
                                    Reply to Reporter
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                      >
                                        Set Due Date
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                      <DialogHeader>
                                        <DialogTitle>Set Due Date</DialogTitle>
                                        <DialogDescription>
                                          Assign a deadline for this ticket
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <Input
                                          id="due-date"
                                          type="date"
                                          min={new Date().toISOString().split('T')[0]}
                                          defaultValue={ticket.due_date ? ticket.due_date.split('T')[0] : ''}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button onClick={() => handleSetDueDate(ticket.id, document.getElementById('due-date')?.value)}>
                                          Save Date
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium">Ticket Resolution Rate</p>
                      <p className="text-2xl font-bold">
                        {ticketStats.totalTickets > 0 
                          ? `${Math.round((ticketStats.closedTickets / ticketStats.totalTickets) * 100)}%` 
                          : '0%'
                        }
                      </p>
                      <div className="w-full h-3 bg-gray-200 rounded-full mt-2">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${ticketStats.totalTickets > 0 
                              ? Math.round((ticketStats.closedTickets / ticketStats.totalTickets) * 100)
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* BETA TICKETS TAB */}
        <TabsContent value="tickets">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Tickets</CardTitle>
                <CardDescription>All beta and testing tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{ticketStats.totalTickets}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Open Tickets</CardTitle>
                <CardDescription>Tickets awaiting action</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{ticketStats.openTickets}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Closed Tickets</CardTitle>
                <CardDescription>Completed tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{ticketStats.closedTickets}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>High Priority</CardTitle>
                <CardDescription>Urgent tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{ticketStats.highPriorityTickets}</p>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="timeline" className="mb-6">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="tickets">Tickets List</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Gantt chart of beta testing tickets</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  {!isLoading && betaTickets.length > 0 ? (
                    <GanttChartView tickets={betaTickets.map(ticket => ({
                      id: ticket.id,
                      title: ticket.title,
                      start: new Date(ticket.created_at),
                      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 14)),
                      status: ticket.status,
                      priority: ticket.priority,
                      progress: ticket.status === 'done' ? 100 : ticket.status === 'in-progress' ? 50 : 0,
                      type: 'task',
                      project: 'Beta Testing'
                    }))} />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      {isLoading ? "Loading timeline..." : "No beta tickets found"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Beta Testing Tickets</CardTitle>
                  <CardDescription>All beta and testing related tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-4">Loading tickets...</div>
                  ) : betaTickets.length === 0 ? (
                    <div className="text-center py-4">No beta tickets found</div>
                  ) : (
                    <div className="space-y-4">
                      {betaTickets.map(ticket => (
                        <div key={ticket.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{ticket.title}</h3>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                ticket.status === 'done' ? 'bg-green-100 text-green-800' : 
                                ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                          
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Created: </span>
                              {formatDate(ticket.created_at)}
                            </div>
                            {ticket.due_date && (
                              <div>
                                <span className="text-gray-500">Due: </span>
                                {formatDate(ticket.due_date)}
                              </div>
                            )}
                            {ticket.reporter_email && (
                              <div>
                                <span className="text-gray-500">Reporter: </span>
                                {ticket.reporter_email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* APPLICATIONS TAB */}
        <TabsContent value="applications">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
              <CardDescription>Breakdown of all job applications</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-pulse bg-muted h-40 w-full rounded-md"></div>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Pending</TableCell>
                        <TableCell className="text-right">{stats.pendingApplications}</TableCell>
                        <TableCell className="text-right">
                          {stats.totalApplications ? 
                            `${Math.round((stats.pendingApplications / stats.totalApplications) * 100)}%` : 
                            '0%'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Accepted</TableCell>
                        <TableCell className="text-right">{stats.acceptedApplications}</TableCell>
                        <TableCell className="text-right">
                          {stats.totalApplications ? 
                            `${Math.round((stats.acceptedApplications / stats.totalApplications) * 100)}%` : 
                            '0%'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Withdrawn</TableCell>
                        <TableCell className="text-right">{stats.withdrawnApplications}</TableCell>
                        <TableCell className="text-right">
                          {stats.totalApplications ? 
                            `${Math.round((stats.withdrawnApplications / stats.totalApplications) * 100)}%` : 
                            '0%'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Rejected</TableCell>
                        <TableCell className="text-right">{stats.rejectedApplications}</TableCell>
                        <TableCell className="text-right">
                          {stats.totalApplications ? 
                            `${Math.round((stats.rejectedApplications / stats.totalApplications) * 100)}%` : 
                            '0%'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6">
                    <p className="font-medium mb-2">Application Status Distribution</p>
                    <div className="w-full h-8 flex rounded-md overflow-hidden">
                      {stats.totalApplications > 0 && (
                        <>
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(stats.pendingApplications / stats.totalApplications) * 100}%` }}
                            title={`Pending: ${stats.pendingApplications}`}
                          ></div>
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(stats.acceptedApplications / stats.totalApplications) * 100}%` }}
                            title={`Accepted: ${stats.acceptedApplications}`}
                          ></div>
                          <div 
                            className="h-full bg-amber-500" 
                            style={{ width: `${(stats.withdrawnApplications / stats.totalApplications) * 100}%` }}
                            title={`Withdrawn: ${stats.withdrawnApplications}`}
                          ></div>
                          <div 
                            className="h-full bg-red-500" 
                            style={{ width: `${(stats.rejectedApplications / stats.totalApplications) * 100}%` }}
                            title={`Rejected: ${stats.rejectedApplications}`}
                          ></div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div>
                        <span>Accepted</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-500 rounded-sm mr-1"></div>
                        <span>Withdrawn</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
                        <span>Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ 
  title, 
  value, 
  icon, 
  isLoading 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  isLoading: boolean 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SweaquityDashboard;
