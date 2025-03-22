
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { RefreshCw, ExternalLink, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProjectsOverviewProps {
  currentProjects: any[];
  pastProjects: any[];
  onDocumentAction: (projectId: string, action: "edit" | "approve") => void;
  userTickets: any[];
  onTicketAction: (ticketId: string, action: string, data?: any) => Promise<void>;
  refreshTickets: () => Promise<void>;
}

const ProjectsOverview = ({
  currentProjects = [],
  pastProjects = [],
  onDocumentAction,
  userTickets = [],
  onTicketAction,
  refreshTickets
}: ProjectsOverviewProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [timeEntry, setTimeEntry] = useState({
    hours: "",
    description: ""
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to view projects");
        return;
      }

      const { data, error } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
  };

  const handleLogTime = async () => {
    if (!selectedProject || !timeEntry.hours || isNaN(parseFloat(timeEntry.hours))) {
      toast.error("Please enter valid hours");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to log time");
        return;
      }

      const timeData = {
        ticket_id: selectedProject.ticket_id,
        user_id: user.id,
        hours_logged: parseFloat(timeEntry.hours),
        description: timeEntry.description,
        start_time: new Date().toISOString()
      };

      // Insert time entry
      const { error } = await supabase
        .from('time_entries')
        .insert(timeData);

      if (error) {
        throw error;
      }

      toast.success("Time logged successfully");
      setIsLogTimeOpen(false);
      setTimeEntry({ hours: "", description: "" });
      await loadProjects();
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error('Failed to log time');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects Overview</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadProjects} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active projects found.</p>
          </div>
        ) : (
          <ResizablePanelGroup direction="vertical" className="min-h-[400px]">
            <ResizablePanel defaultSize={50}>
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {projects.map((project) => (
                    <Card 
                      key={project.job_app_id || project.id} 
                      className={`overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${
                        selectedProject && (selectedProject.job_app_id === project.job_app_id || selectedProject.id === project.id) 
                          ? 'border-primary' 
                          : ''
                      }`}
                      onClick={() => handleProjectClick(project)}
                    >
                      <CardHeader className="bg-muted/50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{project.project_title?.charAt(0) || 'P'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{project.project_title || 'Unnamed Project'}</h3>
                              <p className="text-sm text-muted-foreground">Equity: {project.equity_agreed || 0} points</p>
                            </div>
                          </div>
                          <Badge>{project.application_status || 'Active'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.project_completion || 0}%</span>
                          </div>
                          <Progress value={project.project_completion || 0} className="h-2" />
                          
                          {project.ticket_id && (
                            <div className="mt-3 p-2 bg-muted/30 rounded">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium">{project.ticket_title || 'Task'}</p>
                                <Badge variant="outline" className="text-xs">{project.ticket_status || 'In Progress'}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {project.ticket_description || 'No description'}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-4 text-sm">
                            <span className="text-muted-foreground">Hours: {project.total_hours_logged || 0}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                                setIsLogTimeOpen(true);
                              }}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Log Time
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <Tabs defaultValue="details">
                <div className="p-4">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-4">
                    {selectedProject ? (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {selectedProject.project_title || 'Project Details'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Status: {selectedProject.application_status || 'Active'}
                            </p>
                          </div>
                          
                          {selectedProject.ticket_description && (
                            <div>
                              <h4 className="font-medium text-sm mb-1">Description</h4>
                              <p className="text-sm">{selectedProject.ticket_description}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-1">Equity Points</h4>
                              <p className="text-sm">{selectedProject.equity_points || 0}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-1">Hours Logged</h4>
                              <p className="text-sm">{selectedProject.total_hours_logged || 0}</p>
                            </div>
                          </div>
                          
                          {selectedProject.due_date && (
                            <div>
                              <h4 className="font-medium text-sm mb-1">Due Date</h4>
                              <p className="text-sm">{new Date(selectedProject.due_date).toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setIsLogTimeOpen(true)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Log Time
                            </Button>
                            {selectedProject.ticket_id && (
                              <Button size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Task
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-muted-foreground">Select a project to view details</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        {selectedProject ? (
                          <div className="space-y-4">
                            <h3 className="font-medium">Recent Activity</h3>
                            <div className="space-y-3">
                              {selectedProject.ticket_created_at && (
                                <div className="border-l-2 border-gray-200 pl-4">
                                  <p className="text-sm font-medium">Task Created</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(selectedProject.ticket_created_at).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {selectedProject.date_accepted && (
                                <div className="border-l-2 border-gray-200 pl-4">
                                  <p className="text-sm font-medium">Project Accepted</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(selectedProject.date_accepted).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {selectedProject.ticket_updated_at && (
                                <div className="border-l-2 border-gray-200 pl-4">
                                  <p className="text-sm font-medium">Task Updated</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(selectedProject.ticket_updated_at).toLocaleString()}
                                  </p>
                                </div>
                              )}
                              
                              {(!selectedProject.ticket_created_at && 
                                !selectedProject.date_accepted && 
                                !selectedProject.ticket_updated_at) && (
                                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Select a project to view activity</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </CardContent>

      {/* Log Time Dialog */}
      <Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time for Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                placeholder="e.g., 2.5"
                value={timeEntry.hours}
                onChange={(e) => setTimeEntry({...timeEntry, hours: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What did you work on?"
                value={timeEntry.description}
                onChange={(e) => setTimeEntry({...timeEntry, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogTimeOpen(false)}>Cancel</Button>
            <Button onClick={handleLogTime}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectsOverview;
