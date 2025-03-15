
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SweaquityDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sweaquity Admin Dashboard</h1>
        <Button variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
      
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
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>Breakdown of all job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-pulse bg-muted h-40 w-full rounded-md"></div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tasks Overview</CardTitle>
            <CardDescription>Status of project tasks</CardDescription>
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
                  <Briefcase className="h-10 w-10 text-blue-500" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Completed Tasks</p>
                    <p className="text-3xl font-bold">{stats.completedTasks}</p>
                  </div>
                  <CircleDollarSign className="h-10 w-10 text-green-500" />
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.openTasks + stats.completedTasks > 0 
                      ? `${Math.round((stats.completedTasks / (stats.openTasks + stats.completedTasks)) * 100)}%` 
                      : '0%'
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
