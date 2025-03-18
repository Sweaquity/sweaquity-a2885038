import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";

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
  notes?: Array<{         // Activity timeline
    action: string;
    user: string;
    timestamp: string;
    comment?: string;
    
  }>
  | null
  ;
 
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
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to add note");
        return;
      }
      
      // Prepare notes array
      let notes = ticketData.notes || [];
      
      // Add new note
      notes.push({
        action: 'Note added',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: note
      });
      
      // Update the ticket with new activity
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          notes: notes,
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
        .select('notes, status')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to update status");
        return;
      }
      
      // Prepare notes array
      let notes = ticketData.notes || [];
      
      // Add new activity
      notes.push({
        action: `Status changed from ${ticketData.status} to ${status}`,
        user: userName,
        timestamp: new Date().toISOString()
      });
      
      // Update the ticket with new status and activity
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: status,
          notes: notes,
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
        .select('notes, priority')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to update priority");
        return;
      }
      
      // Prepare notes array
      let notes = ticketData.notes || [];
      
      // Add new activity
      notes.push({
        action: `Priority changed from ${ticketData.priority} to ${priority}`,
        user: userName,
        timestamp: new Date().toISOString()
      });
      
      // Update the ticket with new priority and activity
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          priority: priority,
          notes: notes,
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
        .select('notes')
        .eq('id', activeTicketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        // Still continue, because the message was sent
      } else {
        // Prepare notes array
        let notes = ticketData.notes || [];
        
        // Add new activity
        notes.push({
          action: 'Reply sent to reporter',
          user: userName,
          timestamp: new Date().toISOString(),
          comment: replyMessage
        });
        
        // Update the ticket with new activity
        await supabase
          .from('tickets')
          .update({
            notes: notes,
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
        .select('notes, due_date')
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
      
      // Prepare notes array
      let notes = ticketData.notes || [];
      
      // Add new activity
      notes.push({
        action: `Due date changed from ${oldDueDate} to ${newDueDate}`,
        user: userName,
        timestamp: new Date().toISOString()
      });
      
      // Update the ticket with new due date and activity
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          due_date: new Date(dueDateStr).toISOString(),
          notes: notes,
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

  // Stat Card component
  const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className="p-2 bg-blue-50 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
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
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-pulse bg-muted h-40 w-full rounded-md"></div>
                  </div>
                ) : (
                  <div>
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
                                  {ticket.notes ? (
                                    ticket.notes.map((activity, index) => (
                                      <div key={index} className="relative pl-4 pb-2">
                                        <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px]"></div>
                                        <p className="font-medium">{activity.action}</p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(activity.timestamp).toLocaleString()} by {activity.user}
                                        </p>
                                        {activity.comment && (
                                          <p className="mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                            {activity.comment}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 italic">No activity recorded yet</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Ticket actions */}
                              <div className="border-t pt-4 flex flex-wrap gap-4">
                                {/* Status update */}
                                <div>
                                  <Label htmlFor={`status-${ticket.id}`} className="text-xs block mb-1">Update Status</Label>
                                  <Select
                                    defaultValue={ticket.status}
                                    onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                                  >
                                    <SelectTrigger id={`status-${ticket.id}`} className="w-[140px]">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
                                      <SelectItem value="done">Done</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Priority update */}
                                <div>
                                  <Label htmlFor={`priority-${ticket.id}`} className="text-xs block mb-1">Update Priority</Label>
                                  <Select
                                    defaultValue={ticket.priority}
                                    onValueChange={(value) => handleUpdateTicketPriority(ticket.id, value)}
                                  >
                                    <SelectTrigger id={`priority-${ticket.id}`} className="w-[140px]">
                                      <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Due date */}
                                <div>
                                  <Label htmlFor={`due-date-${ticket.id}`} className="text-xs block mb-1">Set Due Date</Label>
                                  <Input
                                    id={`due-date-${ticket.id}`}
                                    type="date"
                                    className="w-[180px]"
                                    value={ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleSetDueDate(ticket.id, e.target.value)}
                                  />
                                </div>
                                
                                {/* Reply to reporter */}
                                {ticket.reporter && (
                                  <div className="ml-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleReplyToReporter(ticket.id)}
                                    >
                                      Reply to Reporter
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Add note section */}
                              <div className="mt-4 border-t pt-4">
                                <Label htmlFor={`note-${ticket.id}`} className="text-sm font-medium mb-1 block">Add Note</Label>
                                <div className="flex gap-2">
                                  <Textarea 
                                    id={`note-${ticket.id}`}
                                    placeholder="Add a note about this ticket..."
                                    className="min-h-[80px]"
                                    value={ticket.newNote || ''}
                                    onChange={(e) => {
                                      // Update newNote in state
                                      setBetaTickets(prev => prev.map(t => 
                                        t.id === ticket.id ? {...t, newNote: e.target.value} : t
                                      ));
                                    }}
                                  />
                                  <Button 
                                    className="self-end" 
                                    onClick={() => handleAddTicketNote(ticket.id, ticket.newNote || '')}
                                  >
                                    Add Note
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                      
                      {betaTickets.length === 0 && !isLoading && (
                        <div className="text-center py-8">
                          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                          <h3 className="text-lg font-medium">No Beta Testing Tickets Found</h3>
                          <p className="text-gray-500 mt-2">
                            There are currently no beta testing tickets in the system.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* TICKETS TAB */}
        <TabsContent value="tickets">
          {/* Beta testing tickets detailed view */}
          <Card>
            <CardHeader>
              <CardTitle>Beta Testing Tickets</CardTitle>
              <CardDescription>Manage and respond to user-reported issues</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-24 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stats overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Total Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.totalTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Open Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.openTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Closed Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.closedTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">High Priority</p>
                          <p className="text-3xl font-bold">{ticketStats.highPriorityTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Tickets List */}
                  {betaTickets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {betaTickets.map(ticket => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.title}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                ticket.status === 'done' || ticket.status === 'closed' ? 'bg-green-100 text-green-800' : 
                                ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                                ticket.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {ticket.priority}
                              </span>
                            </TableCell>
                            <TableCell>{ticket.reporter_email || 'Unknown'}</TableCell>
                            <TableCell>{formatDate(ticket.created_at)}</TableCell>
                            <TableCell>{ticket.due_date ? formatDate(ticket.due_date) : 'Not set'}</TableCell>
                            <TableCell>
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                      <h3 className="text-lg font-medium">No Tickets Found</h3>
                      <p className="text-gray-500 mt-2">There are currently no beta testing tickets in the system.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* APPLICATIONS TAB */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Statistics</CardTitle>
              <CardDescription>Overview of all job applications in the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Total Applications</p>
                          <p className="text-3xl font-bold">{stats.totalApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Pending</p>
                          <p className="text-3xl font-bold">{stats.pendingApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Accepted</p>
                          <p className="text-3xl font-bold">{stats.acceptedApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Withdrawn/Rejected</p>
                          <p className="text-3xl font-bold">{stats.withdrawnApplications + stats.rejectedApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Pending', value: stats.pendingApplications },
                        { name: 'Accepted', value: stats.acceptedApplications },
                        { name: 'Withdrawn', value: stats.withdrawnApplications },
                        { name: 'Rejected', value: stats.rejectedApplications },
                      ]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reply dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reply to Reporter</DialogTitle>
            <DialogDescription>
              Send a message to the person who reported this issue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                className="min-h-[150px]"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendReplyToReporter}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SweaquityDashboard;
