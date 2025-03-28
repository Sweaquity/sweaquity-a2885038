import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectList } from "../ProjectList";
import { ProjectForm } from "../ProjectForm";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  skills_required: string[];
  timeframe: string;
  equity_allocation: number;
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

  const renderTaskDetails = (tasks: Task[]) => {
    if (tasks.length === 0) {
      return <p className="text-sm text-muted-foreground">No tasks have been created for this project yet.</p>;
    }

    return (
      <div className="space-y-2 mt-2">
        {tasks.map(task => (
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
              <div className="col-span-2">
                <p className="text-xs font-medium">Skills Required</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.skills_required && task.skills_required.length > 0 ? (
                    task.skills_required.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                  {task.skills_required && task.skills_required.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.skills_required.length - 3} more
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
                    className="p-4 flex justify-between items-center border-b bg-gray-50 cursor-pointer"
                    onClick={() => toggleProjectExpanded(project.project_id)}
                  >
                    <div className="flex-grow">
                      <h3 className="font-medium text-lg">{project.title}</h3>
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
                        <p className="text-sm text-muted-foreground">
                          {project.description || 'No description provided.'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tasks</h4>
                        {renderTaskDetails(project.tasks)}
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
