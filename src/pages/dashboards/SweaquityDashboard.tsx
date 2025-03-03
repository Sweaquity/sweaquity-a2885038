
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardStats {
  userCounts: {
    total: number;
    businesses: number;
    profiles: number;
  };
  projectCounts: {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
  };
  applicationCounts: {
    total: number;
    pending: number;
    inReview: number;
    negotiation: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  };
  taskCounts: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

const SweaquityDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    userCounts: { total: 0, businesses: 0, profiles: 0 },
    projectCounts: { total: 0, active: 0, completed: 0, abandoned: 0 },
    applicationCounts: { 
      total: 0, pending: 0, inReview: 0, negotiation: 0, 
      accepted: 0, rejected: 0, withdrawn: 0 
    },
    taskCounts: { total: 0, pending: 0, inProgress: 0, completed: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch user counts
        const { data: profilesCount, error: profilesError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        const { data: businessesCount, error: businessesError } = await supabase
          .from('businesses')
          .select('businesses_id', { count: 'exact', head: true });

        // Fetch project counts
        const { data: projectsData, error: projectsError } = await supabase
          .from('business_projects')
          .select('status');
        
        // Fetch application counts
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('status');
          
        // Fetch task counts
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('task_status');

        if (profilesError || businessesError || projectsError || applicationsError || tasksError) {
          throw new Error("Error fetching statistics");
        }

        // Process projects data
        const projectsByStatus = projectsData?.reduce((acc: any, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {});

        // Process applications data
        const applicationsByStatus = applicationsData?.reduce((acc: any, app) => {
          const status = app.status.toLowerCase();
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Process tasks data
        const tasksByStatus = tasksData?.reduce((acc: any, task) => {
          const status = task.task_status.toLowerCase();
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setStats({
          userCounts: {
            total: (profilesCount?.count || 0) + (businessesCount?.count || 0),
            profiles: profilesCount?.count || 0,
            businesses: businessesCount?.count || 0
          },
          projectCounts: {
            total: projectsData?.length || 0,
            active: projectsByStatus?.active || 0,
            completed: projectsByStatus?.completed || 0,
            abandoned: projectsByStatus?.abandoned || 0
          },
          applicationCounts: {
            total: applicationsData?.length || 0,
            pending: applicationsByStatus?.pending || 0,
            inReview: applicationsByStatus?.['in review'] || 0,
            negotiation: applicationsByStatus?.negotiation || 0,
            accepted: applicationsByStatus?.accepted || 0,
            rejected: applicationsByStatus?.rejected || 0,
            withdrawn: applicationsByStatus?.withdrawn || 0
          },
          taskCounts: {
            total: tasksData?.length || 0,
            pending: tasksByStatus?.pending || 0,
            inProgress: tasksByStatus?.['in progress'] || 0,
            completed: tasksByStatus?.completed || 0
          }
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sweaquity Admin Dashboard</h1>
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total Users" 
              value={stats.userCounts.total} 
              description="Job seekers and businesses" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Total Projects" 
              value={stats.projectCounts.total} 
              description="All business projects" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Applications" 
              value={stats.applicationCounts.total} 
              description="All job applications" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Tasks" 
              value={stats.taskCounts.total} 
              description="All project tasks" 
              isLoading={isLoading} 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Job Seekers:</span>
                    <span className="font-medium">{stats.userCounts.profiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Businesses:</span>
                    <span className="font-medium">{stats.userCounts.businesses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-medium">{stats.applicationCounts.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Review:</span>
                    <span className="font-medium">{stats.applicationCounts.inReview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negotiation:</span>
                    <span className="font-medium">{stats.applicationCounts.negotiation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accepted:</span>
                    <span className="font-medium">{stats.applicationCounts.accepted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected:</span>
                    <span className="font-medium">{stats.applicationCounts.rejected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawn:</span>
                    <span className="font-medium">{stats.applicationCounts.withdrawn}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCard 
              title="Job Seekers" 
              value={stats.userCounts.profiles} 
              description="Individual talent profiles" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Businesses" 
              value={stats.userCounts.businesses} 
              description="Registered companies" 
              isLoading={isLoading} 
            />
          </div>
          
          <UserTable />
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Active Projects" 
              value={stats.projectCounts.active} 
              description="Currently in progress" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Completed Projects" 
              value={stats.projectCounts.completed} 
              description="Successfully finished" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Abandoned Projects" 
              value={stats.projectCounts.abandoned} 
              description="Discontinued projects" 
              isLoading={isLoading} 
            />
          </div>
          
          <ProjectTable />
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Pending/In Review" 
              value={stats.applicationCounts.pending + stats.applicationCounts.inReview} 
              description="Awaiting response" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Accepted" 
              value={stats.applicationCounts.accepted} 
              description="Successfully matched" 
              isLoading={isLoading} 
            />
            <StatsCard 
              title="Rejected/Withdrawn" 
              value={stats.applicationCounts.rejected + stats.applicationCounts.withdrawn} 
              description="Not proceeded" 
              isLoading={isLoading} 
            />
          </div>
          
          <ApplicationTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatsCard = ({ 
  title, 
  value, 
  description, 
  isLoading 
}: { 
  title: string; 
  value: number; 
  description: string; 
  isLoading: boolean;
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

const UserTable = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, created_at')
          .limit(10);

        if (profilesError) throw profilesError;
        
        setUsers(profiles || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="h-60 flex items-center justify-center">Loading user data...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="p-3">{user.id.substring(0, 8)}...</td>
              <td className="p-3">{user.first_name} {user.last_name}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="p-3 text-center">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const ProjectTable = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('business_projects')
          .select(`
            project_id,
            title,
            status,
            equity_allocation,
            equity_allocated,
            created_at,
            businesses (company_name)
          `)
          .limit(10);

        if (error) throw error;
        
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return <div className="h-60 flex items-center justify-center">Loading project data...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Company</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Equity</th>
            <th className="p-3 text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.project_id} className="border-b">
              <td className="p-3">{project.project_id.substring(0, 8)}...</td>
              <td className="p-3">{project.title}</td>
              <td className="p-3">{project.businesses?.company_name || 'N/A'}</td>
              <td className="p-3">{project.status}</td>
              <td className="p-3">{project.equity_allocated}/{project.equity_allocation}%</td>
              <td className="p-3">{new Date(project.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="p-3 text-center">No projects found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const ApplicationTable = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            job_app_id,
            status,
            applied_at,
            accepted_business,
            accepted_jobseeker,
            profiles:user_id (first_name, last_name),
            business_roles:project_sub_tasks (
              title,
              project:business_projects (
                businesses (company_name)
              )
            )
          `)
          .limit(10);

        if (error) throw error;
        
        setApplications(data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (isLoading) {
    return <div className="h-60 flex items-center justify-center">Loading application data...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-3 text-left">ID</th>
            <th className="p-3 text-left">Job Seeker</th>
            <th className="p-3 text-left">Company</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Applied At</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.job_app_id} className="border-b">
              <td className="p-3">{app.job_app_id.substring(0, 8)}...</td>
              <td className="p-3">
                {app.profiles?.first_name} {app.profiles?.last_name}
              </td>
              <td className="p-3">
                {app.business_roles?.project?.businesses?.company_name || 'N/A'}
              </td>
              <td className="p-3">{app.business_roles?.title || 'N/A'}</td>
              <td className="p-3">
                <StatusDisplay 
                  status={app.status} 
                  jobseekerAccepted={app.accepted_jobseeker} 
                  businessAccepted={app.accepted_business} 
                />
              </td>
              <td className="p-3">{new Date(app.applied_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr>
              <td colSpan={6} className="p-3 text-center">No applications found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const StatusDisplay = ({ 
  status, 
  jobseekerAccepted, 
  businessAccepted 
}: { 
  status: string; 
  jobseekerAccepted: boolean; 
  businessAccepted: boolean;
}) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  
  switch (status.toLowerCase()) {
    case 'pending':
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case 'in review':
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case 'negotiation':
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
    case 'accepted':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case 'rejected':
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case 'withdrawn':
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      break;
  }
  
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
      {status.toLowerCase() === 'accepted' && (
        <div className="ml-1 flex gap-1">
          {jobseekerAccepted && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
          {businessAccepted && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
        </div>
      )}
    </div>
  );
};

export default SweaquityDashboard;
