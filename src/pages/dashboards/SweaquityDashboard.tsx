import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChartView } from "@/components/business/testing/GanttChartView";

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
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-pulse bg-muted h-40 w-full rounded-md"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Total Beta Tickets</p>
                        <p className="text-3xl font-bold">{ticketStats.totalTickets}</p>
                      </div>
                      <FileText className="h-10 w-10 text-blue-500" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">High Priority Issues</p>
                        <p className="text-3xl font-bold">{ticketStats.highPriorityTickets}</p>
                      </div>
                      <AlertTriangle className="h-10 w-10 text-red-500" />
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
