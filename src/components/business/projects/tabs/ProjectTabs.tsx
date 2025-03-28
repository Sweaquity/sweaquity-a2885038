import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectList } from "../ProjectList";
import { ProjectForm } from "../ProjectForm";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

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
  due_date?: string;
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

interface EquityStats {
  taskEquityTotal: number;
  agreedEquityTotal: number;
  earnedEquityTotal: number;
}

interface ProjectTabsProps {
  projects: Project[];
  equityStats: Record<string, EquityStats>;
  showProjectForm: boolean;
  setShowProjectForm: (show: boolean) => void;
  handleProjectCreated: (newProject: Project) => void;
  handleProjectUpdated: (updatedProject: Project) => void;
  handleProjectDeleted: (projectId: string) => void;
}

export const ProjectTabs = ({
  projects,
  equityStats,
  showProjectForm,
  setShowProjectForm,
  handleProjectCreated,
  handleProjectUpdated,
  handleProjectDeleted
}: ProjectTabsProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

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

  const renderEquityBreakdown = (project: Project) => {
    const stats = equityStats[project.project_id] || {
      taskEquityTotal: 0,
      agreedEquityTotal: 0,
      earnedEquityTotal: 0
    };

    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-1">Total Equity Offered:</span>
          <span className="text-sm">{project.equity_allocation || 0}%</span>
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
          <span className="text-sm font-medium mr-1">Task Equity %:</span>
          <span className="text-sm">{stats.taskEquityTotal.toFixed(2)}%</span>
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
          <span className="text-sm font-medium mr-1">Agreed Equity:</span>
          <span className="text-sm">{stats.agreedEquityTotal.toFixed(2)}%</span>
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
          <span className="text-sm font-medium mr-1">Equity Earned:</span>
          <span className="text-sm">{stats.earnedEquityTotal.toFixed(2)}%</span>
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
    );
  };

  const renderTaskDetails = (project: Project) => {
    if (project.tasks.length === 0) {
      return <p className="text-sm text-muted-foreground">No tasks have been created for this project yet.</p>;
    }

    return (
      <div className="space-y-2 mt-2">
        {project.tasks.map(task => (
          <div key={task.id} className="border p-3 rounded-md">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">{task.title}</h5>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      // Add edit task handler
                      // onClick={() => handleEditTask(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      // Add delete task handler
                      // onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description || 'No description'}
                </p>
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
                <p className="text-xs font-medium">Due Date</p>
                <p className="text-sm">
                  {task.due_date 
                    ? new Date(task.due_date).toLocaleDateString() 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium">Skill Requirements</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.skill_requirements && task.skill_requirements.length > 0 ? (
                    task.skill_requirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req.skill} - {req.level}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                  {task.skill_requirements && task.skill_requirements.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.skill_requirements.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
                    className="p-4 flex justify-between items-center border-b bg-gray-50"
                  >
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/projects/${project.project_id}`} 
                            className="flex items-center"
                          >
                            <h3 className="font-medium text-lg mr-2">{project.title}</h3>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingProjectId(project.project_id);
                                setShowProjectForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleProjectDeleted(project.project_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => toggleProjectExpanded(project.project_id)}
                        >
                          {expandedProjects.has(project.project_id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-sm text-muted-foreground">
                          Status: {project.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Timeframe: {project.project_timeframe || 'Not specified'}
                        </p>
                      </div>
                      {renderEquityBreakdown(project)}
                    </div>
                  </div>
                  
                  {expandedProjects.has(project.project_id) && (
                    <div className="p-4">
                      <div className="mb-4">
                        <h4 className="font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.description || 'No description provided.'}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Project Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.skills_required && project.skills_required.length > 0 ? (
                            project.skills_required.map((skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No skills specified</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Tasks</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            // Add handler to create new task
                            // onClick={handleAddTask}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </div>
                        {renderTaskDetails(project)}
                      </div>
                    </div>
                  )}
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
