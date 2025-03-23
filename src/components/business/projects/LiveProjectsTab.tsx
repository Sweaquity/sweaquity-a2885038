
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KanbanBoard, BetaTicket } from "@/components/shared/beta-testing/KanbanBoard";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
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
import { Button } from "@/components/ui/button";
import { DragDropContext } from "react-beautiful-dnd";
import { Task, TaskType } from "@/types/types";

interface LiveProjectsTabProps {
  projectId?: string | null;
}

export function LiveProjectsTab({ projectId }: LiveProjectsTabProps) {
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [tasksData, setTasksData] = useState<any[]>([]);
  const [ticketsData, setTicketsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedTab, setSelectedTab] = useState("kanban");
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
      fetchTickets(selectedProject);
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
      
      // Set the first project as selected by default if there are projects
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
      
      // Make sure we don't have any empty status values before setting to state
      const sanitizedTickets = (data || []).map(ticket => ({
        ...ticket,
        status: ticket.status || 'new', // Provide defaults for empty values
        priority: ticket.priority || 'medium'
      }));
      
      setTicketsData(sanitizedTickets);
      setBetaTickets(sanitizedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      // Validate status to ensure it's never empty
      if (!newStatus || newStatus.trim() === '') {
        console.error('Attempted to update with empty status');
        toast.error("Cannot update with an empty status value");
        return;
      }
      
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      toast.success("Ticket status updated");
      fetchTickets(selectedProject!);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const getGanttTasks = (): Task[] => {
    return ticketsData.map(ticket => ({
      id: ticket.id,
      title: ticket.title,  // This should be 'title' instead of 'name'
      start: new Date(new Date().setDate(new Date().getDate() - 3)),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 4)),
      progress: ticket.status === 'done' ? 100 :
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task' as TaskType,
      isDisabled: false
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Live Project Management</h2>
          
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
                    {project.title || `Project ${project.project_id.slice(0, 8)}`}
                  </SelectItem>
                ))}
                {projectsData.length === 0 && (
                  <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                )}
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
          <Tabs defaultValue="kanban" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
              <TabsTrigger value="tasks">Task Completion</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kanban">
              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                const { draggableId, destination } = result;
                
                handleTicketStatusChange(draggableId, destination.droppableId);
              }}>
                <KanbanBoard 
                  tickets={betaTickets} 
                  onStatusChange={handleTicketStatusChange}
                  onTicketClick={() => {}}
                />
              </DragDropContext>
            </TabsContent>
            
            <TabsContent value="gantt">
              <div className="h-[70vh] overflow-x-auto">
                <GanttChartView tasks={getGanttTasks()} />
              </div>
            </TabsContent>
            
            <TabsContent value="tasks">
              {tasksData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found for this project.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Equity</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksData.map((task) => (
                      <TableRow key={task.task_id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.description}</TableCell>
                        <TableCell>{task.equity_allocation}%</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-primary h-2.5 rounded-full" 
                                style={{ width: `${task.completion_percentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{task.completion_percentage || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
