
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ReportCircle, Users, Briefcase, Database } from "lucide-react";

const SweaquityDashboard = () => {
  const [counts, setCounts] = useState({
    profiles: 0,
    businesses: 0,
    projects: 0,
    applications: 0
  });
  
  const [applicationsByStatus, setApplicationsByStatus] = useState<{name: string, value: number}[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch counts
        const [profilesRes, businessesRes, projectsRes, applicationsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('businesses').select('businesses_id', { count: 'exact', head: true }),
          supabase.from('business_projects').select('project_id', { count: 'exact', head: true }),
          supabase.from('job_applications').select('job_app_id', { count: 'exact', head: true })
        ]);
        
        // Fetch application status counts
        const { data: appStatusData } = await supabase
          .from('job_applications')
          .select('status')
          .not('status', 'is', null);
          
        // Fetch task status counts
        const { data: taskStatusData } = await supabase
          .from('project_sub_tasks')
          .select('task_status')
          .not('task_status', 'is', null);
        
        // Calculate counts from returned data
        const profileCount = profilesRes.count || 0;
        const businessCount = businessesRes.count || 0;
        const projectCount = projectsRes.count || 0;
        const applicationCount = applicationsRes.count || 0;
        
        setCounts({
          profiles: profileCount,
          businesses: businessCount,
          projects: projectCount,
          applications: applicationCount
        });
        
        // Process application status data
        if (appStatusData) {
          const statusCounts: Record<string, number> = {};
          appStatusData.forEach(app => {
            const status = app.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          
          const statusArray = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
          }));
          
          setApplicationsByStatus(statusArray);
        }
        
        // Process task status data
        if (taskStatusData) {
          const statusCounts: Record<string, number> = {};
          taskStatusData.forEach(task => {
            const status = task.task_status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          
          const statusArray = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
          }));
          
          setTasksByStatus(statusArray);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sweaquity Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Profiles</p>
                <h2 className="text-3xl font-bold">{counts.profiles}</h2>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Businesses</p>
                <h2 className="text-3xl font-bold">{counts.businesses}</h2>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <h2 className="text-3xl font-bold">{counts.projects}</h2>
              </div>
              <ReportCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <h2 className="text-3xl font-bold">{counts.applications}</h2>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={applicationsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={applicationsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {applicationsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tasksByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" name="Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tasksByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#82ca9d"
                          dataKey="value"
                        >
                          {tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
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

export default SweaquityDashboard;
