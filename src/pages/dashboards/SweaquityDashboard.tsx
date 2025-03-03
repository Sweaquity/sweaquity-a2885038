
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleBarChart, SimplePieChart } from "@/components/ui/chart";
import { supabase } from "@/lib/supabase";
import { PieChart, BarChart, Users, Activity, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SweaquityDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalJobSeekers: 0,
    totalRecruiters: 0
  });
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [applicationStats, setApplicationStats] = useState<{status: string, count: number}[]>([]);
  const [taskStats, setTaskStats] = useState<{status: string, count: number}[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user stats
        const { data: profilesCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
          
        const { data: businessesCount } = await supabase
          .from('businesses')
          .select('businesses_id', { count: 'exact', head: true });
          
        const { data: recruitersCount } = await supabase
          .from('recruiters')
          .select('id', { count: 'exact', head: true });
          
        // Fetch project stats
        const { data: projectsData } = await supabase
          .from('business_projects')
          .select('status')
          .not('status', 'is', null);
          
        const totalProjects = projectsData?.length || 0;
        const activeProjects = projectsData?.filter(p => p.status === 'active').length || 0;
        const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
        
        // Fetch application stats by status
        const { data: applicationData } = await supabase
          .from('job_applications')
          .select('status')
          .not('status', 'is', null);
          
        const applicationStatusCounts: Record<string, number> = {};
        applicationData?.forEach(app => {
          applicationStatusCounts[app.status] = (applicationStatusCounts[app.status] || 0) + 1;
        });
        
        const applicationCountsArray = Object.entries(applicationStatusCounts).map(([status, count]) => ({
          status,
          count
        }));
        
        // Fetch task stats by status
        const { data: taskData } = await supabase
          .from('project_sub_tasks')
          .select('task_status')
          .not('task_status', 'is', null);
          
        const taskStatusCounts: Record<string, number> = {};
        taskData?.forEach(task => {
          taskStatusCounts[task.task_status] = (taskStatusCounts[task.task_status] || 0) + 1;
        });
        
        const taskCountsArray = Object.entries(taskStatusCounts).map(([status, count]) => ({
          status,
          count
        }));
        
        // Set the stats
        setUserStats({
          totalUsers: profilesCount?.count || 0,
          totalBusinesses: businessesCount?.count || 0,
          totalJobSeekers: (profilesCount?.count || 0) - (recruitersCount?.count || 0),
          totalRecruiters: recruitersCount?.count || 0
        });
        
        setProjectStats({
          totalProjects,
          activeProjects,
          completedProjects
        });
        
        setApplicationStats(applicationCountsArray);
        setTaskStats(taskCountsArray);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sweaquity Admin Dashboard</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary/80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Businesses</p>
                <p className="text-2xl font-bold">{userStats.totalBusinesses}</p>
              </div>
              <Database className="h-8 w-8 text-primary/80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projectStats.totalProjects}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{projectStats.activeProjects}</p>
              </div>
              <BarChart className="h-8 w-8 text-primary/80" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart
              data={[
                { name: 'Job Seekers', value: userStats.totalJobSeekers },
                { name: 'Businesses', value: userStats.totalBusinesses },
                { name: 'Recruiters', value: userStats.totalRecruiters }
              ]}
              nameKey="name"
              valueKey="value"
              height={300}
              title=""
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart
              data={[
                { name: 'Active', value: projectStats.activeProjects },
                { name: 'Completed', value: projectStats.completedProjects },
                { name: 'Other', value: projectStats.totalProjects - projectStats.activeProjects - projectStats.completedProjects }
              ]}
              nameKey="name"
              valueKey="value"
              height={300}
              title=""
              colors={["#10b981", "#3b82f6", "#f59e0b"]}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={applicationStats}
              xKey="status"
              yKey="count"
              height={300}
              title=""
              color="#3b82f6"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={taskStats}
              xKey="status"
              yKey="count"
              height={300}
              title=""
              color="#10b981"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SweaquityDashboard;
