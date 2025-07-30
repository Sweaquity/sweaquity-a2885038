import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KanbanBoard } from "./KanbanBoard";
import { TimeTracker } from "./TimeTracker";
import { GanttChartView } from "./GanttChartView";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, Users } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, TaskType } from "@/types/dashboard";
import { GanttTask } from "@/types/business";

export function TestingTab() {
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [applicationsData, setApplicationsData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [ticketsData, setTicketsData] = useState<any[]>([]);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchApplications(selectedProject);
      fetchTasks(selectedProject);
      fetchTickets(selectedProject);
      prepareGanttData(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('business_projects')
        .select(`
          *,
          businesses!inner (
            company_name
          )
        `)
        .eq('business_id', session.user.id);
        
      if (error) throw error;
      
      setProjectsData(data || []);
      
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].project_id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchApplications = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      setApplicationsData(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to load applications");
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      setTasksData(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error("Failed to load tasks");
    }
  };

  const fetchTickets = async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          project:project_id(title)
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      setTicketsData(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const prepareGanttData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const ganttTasksData: GanttTask[] = data.map((task) => {
          const start = task.created_at ? new Date(task.created_at) : new Date();
          const end = new Date(start);
          if (task.timeframe) {
            const timeframe = task.timeframe.toLowerCase();
            if (timeframe.includes('week')) {
              const weeks = parseInt(timeframe) || 1;
              end.setDate(end.getDate() + (weeks * 7));
            } else if (timeframe.includes('month')) {
              const months = parseInt(timeframe) || 1;
              end.setMonth(end.getMonth() + months);
            } else if (timeframe.includes('day')) {
              const days = parseInt(timeframe) || 1;
              end.setDate(end.getDate() + days);
            } else {
              end.setDate(end.getDate() + 7);
            }
          } else {
            end.setDate(end.getDate() + 7);
          }
          
          return {
            id: task.task_id,
            name: task.title,
            start,
            end,
            progress: task.completion_percentage ? task.completion_percentage / 100 : 0,
            type: 'task' as TaskType,
            isDisabled: false,
            styles: { progressColor: '#2196F3', progressSelectedColor: '#1976D2' }
          };
        });
        
        setGanttTasks(ganttTasksData);
      } else {
        setGanttTasks([]);
      }
    } catch (error) {
      console.error('Error preparing Gantt data:', error);
      setGanttTasks([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Project Management Tools</h2>
          
          <div className="w-64">
            <Select 
              value={selectedProject || ''} 
              onValueChange={(value) => setSelectedProject(value)}
              disabled={loadingProjects}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectsData.map((project) => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedProject ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a project to view management tools
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Project Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="tasks">Task Completion</TabsTrigger>
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {projectsData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No projects available.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Project Overview: {projectsData.find(p => p.project_id === selectedProject)?.title}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <h4 className="font-medium">Project Details</h4>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium">Status:</dt>
                            <dd>
                              <Badge>
                                {projectsData.find(p => p.project_id === selectedProject)?.status || 'N/A'}
                              </Badge>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Company:</dt>
                            <dd>{projectsData.find(p => p.project_id === selectedProject)?.businesses?.company_name || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Timeframe:</dt>
                            <dd>{projectsData.find(p => p.project_id === selectedProject)?.project_timeframe || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Total Equity:</dt>
                            <dd>{projectsData.find(p => p.project_id === selectedProject)?.equity_allocation || 0}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Equity Allocated:</dt>
                            <dd>{projectsData.find(p => p.project_id === selectedProject)?.equity_allocated || 0}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Completion:</dt>
                            <dd>{projectsData.find(p => p.project_id === selectedProject)?.completion_percentage || 0}%</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <h4 className="font-medium">Tasks & Applications Summary</h4>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="font-medium flex items-center mb-1">
                              <Users className="mr-2 h-4 w-4" /> Applications
                            </dt>
                            <dd className="text-2xl">{applicationsData.length}</dd>
                          </div>
                          <div>
                            <dt className="font-medium flex items-center mb-1">
                              <Clock className="mr-2 h-4 w-4" /> Tasks
                            </dt>
                            <dd className="text-2xl">{tasksData.length}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="applications">
              {applicationsData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No applications for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsData.map(app => (
                      <TableRow key={app.job_app_id}>
                        <TableCell>
                          {app.profiles?.first_name} {app.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          {tasksData.find(t => t.task_id === app.task_id)?.title || 'Unknown task'}
                        </TableCell>
                        <TableCell>
                          {new Date(app.applied_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            app.status === 'accepted' ? 'bg-green-500' : 
                            app.status === 'pending' ? 'bg-yellow-500' : 
                            app.status === 'rejected' ? 'bg-red-500' : 
                            'bg-gray-500'
                          }>
                            {app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="tasks">
              {tasksData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Timeframe</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Equity</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksData.map(task => (
                      <TableRow key={task.task_id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                        <TableCell>{task.timeframe}</TableCell>
                        <TableCell>
                          <Badge className={
                            task.status === 'completed' ? 'bg-green-500' : 
                            task.status === 'in_progress' ? 'bg-blue-500' : 
                            task.status === 'open' ? 'bg-yellow-500' : 
                            'bg-gray-500'
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.equity_allocation}%</TableCell>
                        <TableCell>{task.completion_percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="kanban">
              <KanbanBoard projectId={selectedProject} />
            </TabsContent>
            
            <TabsContent value="gantt">
              <GanttChartView projectId={selectedProject} tasks={ganttTasks} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
