
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, ChevronUp, HelpCircle, Edit, Trash } from "lucide-react";
import { ProjectForm } from "../ProjectForm";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { Link } from "react-router-dom";

interface Task {
  task_id: string;
  id?: string; // For backward compatibility
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: any[];
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

  // Fetch equity statistics for each project
  useEffect(() => {
    const loadEquityStats = async () => {
      const stats: Record<string, {
        taskEquityTotal: number,
        agreedEquityTotal: number,
        earnedEquityTotal: number
      }> = {};
      
      for (const project of projects) {
        try {
          // Sum task equity
          const taskEquityTotal = project.tasks.reduce(
            (sum, task) => sum + (task.equity_allocation || 0), 0
          );
          
          // Get job applications for this project
          const { data: jobApplications, error: appError } = await supabase
            .from('job_applications')
            .select('job_app_id')
            .eq('project_id', project.project_id);
            
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
            continue;
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

  return (
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
                    <div className="p-4 flex-col md:flex-row border-b bg-gray-50">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">
                            <Link 
                              to={`/projects/${project.project_id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <div className="flex items-center flex-wrap text-muted-foreground text-sm mt-1">
                            <span className="mr-4">Status: {project.status}</span>
                            <span>Timeframe: {project.project_timeframe || 'Not specified'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleProjectUpdated(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleProjectDeleted(project.project_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
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
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
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
                      
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.skills_required.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills_required.length === 0 && (
                            <span className="text-xs text-muted-foreground">No specific skills required</span>
                          )}
                        </div>
                      </div>
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
                            <div className="space-y-3">
                              {project.tasks.map(task => (
                                <div key={task.task_id} className="border p-3 rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-medium">{task.title}</h5>
                                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                        <span className="mr-3">Timeframe: {task.timeframe || 'Not specified'}</span>
                                        <Badge>{task.status}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-destructive">
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
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
                                  
                                  {!expandedTasks.has(task.task_id) && (
                                    <div className="mt-2">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium">Equity:</span>
                                        <span className="text-sm ml-1">{task.equity_allocation || 0}%</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {expandedTasks.has(task.task_id) && (
                                    <div className="mt-3 pt-3 border-t">
                                      <p className="text-sm mb-2">{task.description || 'No description provided.'}</p>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                          <p className="text-xs font-medium">Equity Allocation</p>
                                          <p className="text-sm">{task.equity_allocation || 0}%</p>
                                        </div>
                                        
                                        <div>
                                          <p className="text-xs font-medium">Skills Required</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.isArray(task.skill_requirements) ? 
                                              task.skill_requirements.slice(0, 5).map((skill, index) => {
                                                const skillName = typeof skill === 'string' ? skill : (skill.skill || '');
                                                
                                                return (
                                                  <Badge key={index} variant="outline" className="text-xs">
                                                    {skillName}
                                                  </Badge>
                                                );
                                              }) : 
                                              <span className="text-xs text-muted-foreground">None</span>
                                            }
                                            {Array.isArray(task.skill_requirements) && task.skill_requirements.length > 5 && (
                                              <Badge variant="outline" className="text-xs">+{task.skill_requirements.length - 5} more</Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {task.dependencies.length > 0 && (
                                        <div className="mt-3">
                                          <p className="text-xs font-medium">Dependencies</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {task.dependencies.map((dep, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs">{dep}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
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
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        <p className="text-muted-foreground">No completed projects found.</p>
      </TabsContent>
    </Tabs>
  );
};
