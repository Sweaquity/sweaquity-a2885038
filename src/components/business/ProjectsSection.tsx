
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { ProjectTabs } from "./projects/tabs/ProjectTabs";
import { DeleteProjectDialog } from "./projects/dialogs/DeleteProjectDialog";
import { loadProjects, deleteProject } from "./projects/services/ProjectSectionService";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

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
  project_id: string;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [equityStats, setEquityStats] = useState<Record<string, {
    taskEquityTotal: number,
    agreedEquityTotal: number,
    earnedEquityTotal: number
  }>>({});

  useEffect(() => {
    loadProjectsData();
  }, []);

  const loadProjectsData = async () => {
    const projectsData = await loadProjects();
    setProjects(projectsData);
    
    // Calculate equity statistics for each project
    const stats: Record<string, {
      taskEquityTotal: number,
      agreedEquityTotal: number,
      earnedEquityTotal: number
    }> = {};
    
    for (const project of projectsData) {
      try {
        // Sum task equity
        const taskEquityTotal = project.tasks.reduce(
          (sum, task) => sum + (task.equity_allocation || 0), 0
        );
        
        // Get accepted jobs data for this project
        const { data: acceptedJobs, error } = await supabase
          .from('accepted_jobs')
          .select('job_app_id, equity_agreed, jobs_equity_allocated')
          .eq('project_id', project.project_id);
          
        if (error) {
          console.error("Error fetching equity data:", error);
          continue;
        }
          
        // Sum agreed and earned equity
        const agreedEquityTotal = acceptedJobs?.reduce(
          (sum, job) => sum + (job.equity_agreed || 0), 0
        ) || 0;
        
        const earnedEquityTotal = acceptedJobs?.reduce(
          (sum, job) => sum + (job.jobs_equity_allocated || 0), 0
        ) || 0;
        
        stats[project.project_id] = {
          taskEquityTotal,
          agreedEquityTotal,
          earnedEquityTotal
        };
      } catch (error) {
        console.error("Error calculating equity stats:", error);
      }
    }
    
    setEquityStats(stats);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, { ...newProject, tasks: [] }]);
    setShowProjectForm(false);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.project_id === updatedProject.project_id ? updatedProject : project
    ));
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.project_id !== projectId));
  };

  const showDeleteConfirmation = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      const success = await deleteProject(projectToDelete, projects);
      if (success) {
        handleProjectDeleted(projectToDelete);
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };
  
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
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
        {projects.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground">
              Create your first project to start adding tasks and equity allocations.
            </p>
            <Button 
              variant="default" 
              className="mt-4" 
              onClick={() => setShowProjectForm(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map(project => (
              <div key={project.project_id} className="border rounded-lg overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center border-b bg-gray-50 cursor-pointer"
                  onClick={() => toggleProjectExpanded(project.project_id)}
                >
                  <div>
                    <h3 className="font-medium text-lg">{project.title}</h3>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-sm text-muted-foreground">Status: {project.status}</p>
                      <p className="text-sm text-muted-foreground">Timeframe: {project.project_timeframe || 'Not specified'}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Total Equity Offered:</span>
                          <span className="text-sm ml-1">{project.equity_allocation || 0}%</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <HelpCircle className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Total equity amount allocated to this project when it was created
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Task Equity %:</span>
                          <span className="text-sm ml-1">
                            {equityStats[project.project_id]?.taskEquityTotal.toFixed(2) || 0}%
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <HelpCircle className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Sum of equity allocations across all tasks in this project
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Agreed Equity:</span>
                          <span className="text-sm ml-1">
                            {equityStats[project.project_id]?.agreedEquityTotal.toFixed(2) || 0}%
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <HelpCircle className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Sum of all agreed equity amounts across accepted job applications
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-sm font-medium">Equity Earned:</span>
                          <span className="text-sm ml-1">
                            {equityStats[project.project_id]?.earnedEquityTotal.toFixed(2) || 0}%
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <HelpCircle className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Sum of all equity actually allocated to job seekers as they complete tasks
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost">
                    {expandedProjects.has(project.project_id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {expandedProjects.has(project.project_id) && (
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{project.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Tasks</h4>
                      {project.tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks have been created for this project yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {project.tasks.map(task => (
                            <div key={task.id} className="border p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{task.title}</h5>
                                  <p className="text-sm text-muted-foreground">{task.description || 'No description'}</p>
                                </div>
                                <Badge>{task.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                <div>
                                  <p className="text-xs font-medium">Equity</p>
                                  <p className="text-sm">{task.equity_allocation || 0}%</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Timeframe</p>
                                  <p className="text-sm">{task.timeframe || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Skills Required</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Array.isArray(task.skill_requirements) ? 
                                      task.skill_requirements.slice(0, 3).map((skill, index) => {
                                        const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                                        
                                        return (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {skillName}
                                          </Badge>
                                        );
                                      }) : 
                                      <span className="text-xs text-muted-foreground">None</span>
                                    }
                                    {Array.isArray(task.skill_requirements) && task.skill_requirements.length > 3 && (
                                      <Badge variant="outline" className="text-xs">+{task.skill_requirements.length - 3} more</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <ProjectTabs
          projects={projects}
          showProjectForm={showProjectForm}
          setShowProjectForm={setShowProjectForm}
          handleProjectCreated={handleProjectCreated}
          handleProjectUpdated={handleProjectUpdated}
          handleProjectDeleted={showDeleteConfirmation}
        />
      </CardContent>
      
      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
      />
    </Card>
  );
};
