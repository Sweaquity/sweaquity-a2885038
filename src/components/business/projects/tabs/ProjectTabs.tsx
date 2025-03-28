import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { ProjectForm } from "../ProjectForm";

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
  const [equityStats, setEquityStats] = useState<Record<string, {
    taskEquityTotal: number,
    agreedEquityTotal: number,
    earnedEquityTotal: number
  }>>({});

  useEffect(() => {
    calculateEquityStats();
  }, [projects]);

  const calculateEquityStats = async () => {
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

  const renderProjectDetails = (project: Project) => {
    const stats = equityStats[project.project_id] || {
      taskEquityTotal: 0,
      agreedEquityTotal: 0,
      earnedEquityTotal: 0
    };

    return (
      <div className="p-4 bg-white">
        <div className="mb-4">
          <h4 className="font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium mb-2">Project Details</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm ml-2">{project.status}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Timeframe:</span>
                <span className="text-sm ml-2">{project.project_timeframe || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Equity Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-medium">Total Equity Offered:</span>
                <span className="text-sm ml-2">{project.equity_allocation || 0}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Task Equity %:</span>
                <span className="text-sm ml-2">{stats.taskEquityTotal.toFixed(2)}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Agreed Equity:</span>
                <span className="text-sm ml-2">{stats.agreedEquityTotal.toFixed(2)}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Equity Earned:</span>
                <span className="text-sm ml-2">{stats.earnedEquityTotal.toFixed(2)}%</span>
              </div>
            </div>
          </div>
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
    );
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
            {projects.length === 0 ? (
              <p className="text-muted-foreground">No active projects found.</p>
            ) : (
              projects.map(project => (
                <div key={project.project_id} className="border rounded-lg overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center border-b bg-gray-50 cursor-pointer"
                    onClick={() => toggleProjectExpanded(project.project_id)}
                  >
                    <div>
                      <h3 className="font-medium text-lg">{project.title}</h3>
                    </div>
                    <Button variant="ghost">
                      {expandedProjects.has(project.project_id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {expandedProjects.has(project.project_id) && renderProjectDetails(project)}
                </div>
              ))
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
