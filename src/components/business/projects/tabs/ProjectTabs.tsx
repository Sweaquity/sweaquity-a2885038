import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, ChevronUp, HelpCircle, Edit, Trash } from "lucide-react";
import { ProjectForm } from "../ProjectForm";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import { ProjectEditDialog } from "../ProjectEditDialog";
import { DeleteProjectDialog } from "../../projects/dialogs/DeleteProjectDialog";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  task_id: string;
  title: string;
  description: string;
  status: string;
  hours_logged?: number;
  equity_earned?: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: SkillRequirement[];
  dependencies: string[];
  task_status?: string;
  completion_percentage?: number;
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

interface ProjectTabsProps {
  projects: Project[];
  showProjectForm: boolean;
  setShowProjectForm: (show: boolean) => void;
  handleProjectCreated: (newProject: Project) => void;
  handleProjectUpdated: (updatedProject: Project) => void;
  handleProjectDeleted: (projectId: string) => void;
}

export const ProjectTabs = ({
  projects,
  showProjectForm,
  setShowProjectForm,
  handleProjectCreated,
  handleProjectUpdated,
  handleProjectDeleted
}: ProjectTabsProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [equityStats, setEquityStats] = useState<Record<string, {
    taskEquityTotal: number,
    agreedEquityTotal: number,
    earnedEquityTotal: number
  }>>({});
  
  const [taskEquityStats, setTaskEquityStats] = useState<Record<string, {
    agreedEquity: number,
    earnedEquity: number
  }>>({});
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Fetch equity statistics for each project
  useEffect(() => {
    const loadEquityStats = async () => {
      const stats: Record<string, {
        taskEquityTotal: number,
        agreedEquityTotal: number,
        earnedEquityTotal: number
      }> = {};
      
      const taskStats: Record<string, {
        agreedEquity: number,
        earnedEquity: number
      }> = {};
      
      for (const project of projects) {
        try {
          // Sum task equity
          const taskEquityTotal = project.tasks.reduce(
            (sum, task) => sum + (task.equity_allocation || 0), 0
          );
          
          // Get job applications for this project - first fetch all tasks
          const taskIds = project.tasks.map(task => task.task_id);
          
          // Exit early if no tasks
          if (taskIds.length === 0) {
            stats[project.project_id] = {
              taskEquityTotal,
              agreedEquityTotal: 0,
              earnedEquityTotal: 0
            };
            continue;
          }
          
          // Get all applications for this project's tasks
          const { data: jobApplications, error: appError } = await supabase
            .from('job_applications')
            .select('job_app_id, task_id')
            .in('task_id', taskIds);
            
          if (appError) {
            console.error("Error fetching job applications:", appError);
            continue;
          }
            
          if (!jobApplications || jobApplications.length === 0) {
            stats[project.project_id] = {
              taskEquityTotal,
              agreedEquityTotal: 0,
              earnedEquityTotal: 0
            };
            
            // Initialize stats for each task
            for (const task of project.tasks) {
              taskStats[task.task_id] = {
                agreedEquity: 0,
                earnedEquity: 0
              };
            }
            
            continue;
          }
          
          // Create a map of task_id to job_app_ids
          const taskToAppsMap: Record<string, string[]> = {};
          for (const app of jobApplications) {
            if (!taskToAppsMap[app.task_id]) {
              taskToAppsMap[app.task_id] = [];
            }
            taskToAppsMap[app.task_id].push(app.job_app_id);
          }
          
          const jobAppIds = jobApplications.map(app => app.job_app_id);
          
          // Get accepted jobs data for these applications
          const { data: acceptedJobs, error } = await supabase
            .from('accepted_jobs')
            .select('job_app_id, equity_agreed, jobs_equity_allocated')
            .in('job_app_id', jobAppIds);
            
          if (error) {
            console.error("Error fetching equity data:", error);
            continue;
          }
          
          // Create a map of job_app_id to equity data
          const jobAppToEquityMap: Record<string, { 
            equity_agreed: number, 
            jobs_equity_allocated: number 
          }> = {};
          
          for (const job of acceptedJobs || []) {
            jobAppToEquityMap[job.job_app_id] = {
              equity_agreed: job.equity_agreed || 0,
              jobs_equity_allocated: job.jobs_equity_allocated || 0
            };
          }
          
          // Calculate project level stats
          let projectAgreedEquity = 0;
          let projectEarnedEquity = 0;
          
          // Initialize task stats
          for (const task of project.tasks) {
            taskStats[task.task_id] = {
              agreedEquity: 0,
              earnedEquity: 0
            };
            
            // Get applications for this task
            const taskAppIds = taskToAppsMap[task.task_id] || [];
            
            // Calculate task level stats
            for (const appId of taskAppIds) {
              const equityData = jobAppToEquityMap[appId];
              if (equityData) {
                taskStats[task.task_id].agreedEquity += equityData.equity_agreed;
                taskStats[task.task_id].earnedEquity += equityData.jobs_equity_allocated;
                
                // Also add to project totals
                projectAgreedEquity += equityData.equity_agreed;
                projectEarnedEquity += equityData.jobs_equity_allocated;
              }
            }
          }
          
          stats[project.project_id] = {
            taskEquityTotal,
            agreedEquityTotal: projectAgreedEquity,
            earnedEquityTotal: projectEarnedEquity
          };
        } catch (error) {
          console.error("Error calculating equity stats:", error);
        }
      }
      
      setEquityStats(stats);
      setTaskEquityStats(taskStats);
    };
    
    if (projects.length > 0) {
      loadEquityStats();
    }
  }, [projects]);

  const toggleProjectExpanded = (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
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
  
  const toggleTaskExpanded = (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  
  const handleEditProject = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(project);
  };
  
  const handleDeleteProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      handleProjectDeleted(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <>
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
              <p className="text-muted-foreground mb-4">
                Build your project and add tasks with the details, skills, and equity offered. Job seekers can then apply for tasks to earn equity in your project.
              </p>
              
              {projects.length === 0 ? (
                <p className="text-muted-foreground">No active projects found.</p>
              ) : (
                <div className="space-y-6">
                  {projects.map(project => (
                    <div key={project.project_id} className="border rounded-lg overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b cursor-pointer" onClick={() => toggleProjectExpanded(project.project_id)}>
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1">
                            <Link 
                              to={`/projects/${project.project_id}`}
                              className="text-blue-600 hover:underline text-lg font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {project.title}
                            </Link>
                            <div className="flex items-center flex-wrap text-muted-foreground text-sm mt-1">
                              <span className="mr-4">Status: {project.status}</span>
                              <span>Timeframe: {project.project_timeframe || 'Not specified'}</span>
                            </div>
                            
                            <TooltipProvider>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="text-xs font-medium">Total Equity Offered</div>
                                      <div className="text-sm">{project.equity_allocation}%</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Total equity allocation for this project</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="text-xs font-medium">Task Equity</div>
                                      <div className="text-sm">
                                        {equityStats[project.project_id]?.taskEquityTotal || 0}%
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Sum of equity allocated to all tasks</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="text-xs font-medium">Agreed Equity</div>
                                      <div className="text-sm">
                                        {equityStats[project.project_id]?.agreedEquityTotal || 0}%
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Total equity agreed with job seekers</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <div className="text-xs font-medium">Equity Earned</div>
                                      <div className="text-sm">
                                        {equityStats[project.project_id]?.earnedEquityTotal || 0}%
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Equity already earned by job seekers</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                            
                            <div className="mt-2">
                              <div className="text-xs font-medium">Required Skills</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.skills_required.map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex mt-4 md:mt-0 items-start space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => handleEditProject(project, e)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => handleDeleteProject(project.project_id, e)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => toggleProjectExpanded(project.project_id, e)}
                            >
                              {expandedProjects.has(project.project_id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {expandedProjects.has(project.project_id) && (
                        <div className="p-4">
                          <h3 className="text-sm font-medium mb-3">Project Tasks</h3>
                          
                          {project.tasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No tasks available for this project.</p>
                          ) : (
                            <div className="space-y-4">
                              {project.tasks.map(task => {
                                const taskStats = taskEquityStats[task.task_id] || { agreedEquity: 0, earnedEquity: 0 };
                                
                                return (
                                  <div key={task.task_id} className="border rounded-lg overflow-hidden">
                                    <div className="p-3 bg-gray-50 border-b cursor-pointer" onClick={() => toggleTaskExpanded(task.task_id)}>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium">{task.title}</div>
                                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <span className="mr-2">Status: {task.status || 'Not started'}</span>
                                            <span>Timeframe: {task.timeframe || 'Not specified'}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          {/* Removed redundant edit/delete buttons for tasks */}
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={(e) => toggleTaskExpanded(task.task_id, e)}
                                          >
                                            {expandedTasks.has(task.task_id) ? (
                                              <ChevronUp className="h-4 w-4" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {expandedTasks.has(task.task_id) && (
                                      <div className="p-3">
                                        <div className="space-y-3">
                                          <div>
                                            <div className="text-xs font-medium mb-1">Description</div>
                                            <p className="text-sm">{task.description || 'No description provided.'}</p>
                                          </div>
                                          
                                          <TooltipProvider>
                                            <div className="grid grid-cols-3 gap-4">
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div>
                                                    <div className="text-xs font-medium">Task Equity</div>
                                                    <div className="text-sm">{task.equity_allocation || 0}%</div>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">Equity allocated to this task</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div>
                                                    <div className="text-xs font-medium">Agreed Equity</div>
                                                    <div className="text-sm">{taskStats.agreedEquity || 0}%</div>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">Equity agreed for this task</p>
                                                </TooltipContent>
                                              </Tooltip>
                                              
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div>
                                                    <div className="text-xs font-medium">Equity Earned</div>
                                                    <div className="text-sm">{taskStats.earnedEquity || 0}%</div>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">Equity earned for this task</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </div>
                                          </TooltipProvider>
                                          
                                          <div>
                                            <div className="text-xs font-medium mb-1">Skills Required</div>
                                            <div className="flex flex-wrap gap-1">
                                              {Array.isArray(task.skill_requirements) && task.skill_requirements.length > 0 ? 
                                                task.skill_requirements.map((skill, index) => {
                                                  const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                                                  const level = typeof skill === 'string' ? 'Intermediate' : (skill.level || '');
                                                  
                                                  return (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                      {skillName} {level && <span className="ml-1 opacity-70">({level})</span>}
                                                    </Badge>
                                                  );
                                                }) : 
                                                <span className="text-sm text-muted-foreground">No specific skills required</span>
                                              }
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          <p className="text-muted-foreground">No completed projects found.</p>
        </TabsContent>
      </Tabs>
      
      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
      
      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
      />
    </>
  );
};
