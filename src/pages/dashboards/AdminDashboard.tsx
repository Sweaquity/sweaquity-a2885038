
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, Briefcase, FileText, LogOut, PieChart as PieChartIcon } from "lucide-react";
import { WorkflowMonitoringDashboard } from '@/components/admin/WorkflowMonitoringDashboard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    businessUsers: 0,
    jobSeekers: 0
  });
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [applicationStats, setApplicationStats] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/');
          return;
        }
        
        // For demo purposes - in production, you would have a proper admin role check
        const adminEmails = ['admin@sweaquity.com', 'your-admin-email@example.com'];
        const isAdminUser = adminEmails.includes(session.user.email as string);
        
        if (!isAdminUser) {
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        fetchDashboardData();
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate('/');
      }
    };
    
    checkAdminAccess();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch user statistics
      const { count: businessCount } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });
      
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setUserStats({
        totalUsers: (businessCount || 0) + (profileCount || 0),
        businessUsers: businessCount || 0,
        jobSeekers: profileCount || 0
      });
      
      // Fetch project statistics
      const { data: projects, error: projectError } = await supabase
        .from('business_projects')
        .select('status');
      
      if (projectError) throw projectError;
      
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      
      setProjectStats({
        totalProjects: projects.length,
        activeProjects,
        completedProjects
      });
      
      // Fetch application statistics by status
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('status');
      
      if (appError) throw appError;
      
      const appStatusCounts: Record<string, number> = {};
      applications.forEach(app => {
        const status = app.status.toLowerCase();
        appStatusCounts[status] = (appStatusCounts[status] || 0) + 1;
      });
      
      const appStats = Object.entries(appStatusCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      setApplicationStats(appStats);
      
      // Fetch task statistics by status
      const { data: tasks, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('status');
      
      if (taskError) throw taskError;
      
      const taskStatusCounts: Record<string, number> = {};
      tasks.forEach(task => {
        const status = task.status.toLowerCase();
        taskStatusCounts[status] = (taskStatusCounts[status] || 0) + 1;
      });
      
      const taskStats = Object.entries(taskStatusCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      setTaskStats(taskStats);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="monitoring">Workflow Monitor</TabsTrigger>

          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {userStats.businessUsers} businesses, {userStats.jobSeekers} job seekers
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {projectStats.activeProjects} active, {projectStats.completedProjects} completed
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-500" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applicationStats.reduce((sum, item) => sum + item.value, 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Across all projects
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Job Seekers', value: userStats.jobSeekers },
                            { name: 'Businesses', value: userStats.businessUsers }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Job Seekers', value: userStats.jobSeekers },
                            { name: 'Businesses', value: userStats.businessUsers }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={applicationStats}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Application Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStats}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {applicationStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={taskStats}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monitoring">
``````````  <WorkflowMonitoringDashboard />
``````````</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
