
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ChevronDown, ChevronRight, Edit, Trash2, Link2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectList } from "./projects/ProjectList";
import { ProjectForm } from "./projects/ProjectForm";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: SkillRequirement[];
  dependencies: string[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  equity_allocated: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', session.user.id);

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*');

      if (tasksError) throw tasksError;

      const projectsWithTasks = projectsData.map((project: any) => ({
        ...project,
        tasks: tasksData.filter((task: any) => task.project_id === project.id) || []
      }));

      setProjects(projectsWithTasks);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error("Failed to load projects");
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, { ...newProject, tasks: [] }]);
    setShowProjectForm(false);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ));
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return newExpanded;
    });
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Check if project has allocated equity
      const project = projects.find(p => p.id === projectId);
      if (project && project.equity_allocated > 0) {
        toast.error("Cannot delete a project with allocated equity");
        return;
      }
      
      const { error } = await supabase
        .from('business_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      handleProjectDeleted(projectId);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    }
  };

  const showDeleteConfirmation = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      handleDeleteProject(projectToDelete);
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Projects & Tasks</h2>
        <Button onClick={() => setShowProjectForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {showProjectForm ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Create New Project</h3>
                  <Button variant="outline" onClick={() => setShowProjectForm(false)}>
                    Cancel
                  </Button>
                </div>
                <ProjectForm onProjectCreated={handleProjectCreated} />
              </div>
            ) : (
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-muted-foreground">No active projects found.</p>
                ) : (
                  projects.map((project) => (
                    <Collapsible 
                      key={project.id} 
                      open={expandedProjects.has(project.id)}
                      onOpenChange={() => toggleProjectExpanded(project.id)}
                      className="border rounded-lg overflow-hidden"
                    >
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50">
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-2 flex-1 hover:text-blue-600"
                        >
                          <span className="font-medium text-lg">{project.title}</span>
                          <Badge className="ml-2">{project.equity_allocation}% equity</Badge>
                          <Badge variant="outline">{project.tasks.length} tasks</Badge>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="p-0 h-8 w-8" asChild>
                            <Link to={`/projects/${project.id}`} title="View project details">
                              <Link2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Project edit functionality would go here
                              toast.info("Edit project functionality coming soon");
                            }}
                            title="Edit project"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirmation(project.id);
                            }}
                            disabled={project.equity_allocated > 0}
                            title={project.equity_allocated > 0 ? 
                              "Cannot delete project with allocated equity" : 
                              "Delete project"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="ml-2">
                          {expandedProjects.has(project.id) ? 
                            <ChevronDown className="h-5 w-5 flex-shrink-0" /> : 
                            <ChevronRight className="h-5 w-5 flex-shrink-0" />
                          }
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="bg-muted/30 p-2">
                          <div className="pb-3 px-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                                <p>{project.equity_allocation}%</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Allocated</p>
                                <p>{project.equity_allocated}%</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Available</p>
                                <p>{Math.max(0, project.equity_allocation - project.equity_allocated)}%</p>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground">Required Skills</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.skills_required.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Tasks section */}
                          <div className="space-y-2">
                            {project.tasks.map(task => (
                              <Collapsible 
                                key={task.id} 
                                open={expandedTasks.has(task.id)}
                                onOpenChange={() => toggleTaskExpanded(task.id)}
                                className="border bg-background rounded-md overflow-hidden"
                              >
                                <CollapsibleTrigger className="flex justify-between items-center w-full p-3 text-left hover:bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{task.title}</span>
                                    <Badge variant="outline" className="ml-1">{task.equity_allocation}% equity</Badge>
                                    <Badge 
                                      className={task.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                                    >
                                      {task.status}
                                    </Badge>
                                  </div>
                                  
                                  {expandedTasks.has(task.id) ? 
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" /> : 
                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                  }
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent className="px-3 pb-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                    <div>
                                      <p className="text-sm">{task.description}</p>
                                      <p className="text-sm text-muted-foreground mt-2">Timeframe: {task.timeframe}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium mb-1">Required Skills:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {task.skills_required.map((skill, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                            
                            {project.tasks.length === 0 && (
                              <p className="text-center text-muted-foreground p-3">No tasks created for this project yet.</p>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <p className="text-muted-foreground">No completed projects found.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
