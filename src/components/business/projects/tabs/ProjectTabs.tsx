import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectForm } from "../ProjectForm";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Trash2, Link, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  project_link?: string;
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
  
  // New optional props for editing
  onProjectEdit?: (project: Project) => void;
  onTaskEdit?: (project: Project, task: Task) => void;
  expandedProjects?: Set<string>;
  toggleProjectExpanded?: (projectId: string) => void;
}

export const ProjectTabs = ({
  projects,
  showProjectForm,
  setShowProjectForm,
  handleProjectCreated,
  handleProjectUpdated,
  handleProjectDeleted,
  onProjectEdit,
  onTaskEdit,
  expandedProjects,
  toggleProjectExpanded
}: ProjectTabsProps) => {
  const renderSkillRequirements = (skills: string[] | SkillRequirement[]) => {
    if (!skills || skills.length === 0) {
      return <span className="text-xs text-muted-foreground">No skills specified</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, 5).map((skill, index) => {
          const skillName = typeof skill === 'string' 
            ? skill 
            : `${skill.skill} (${skill.level})`;
          
          return (
            <Badge key={index} variant="outline" className="text-xs">
              {skillName}
            </Badge>
          );
        })}
        {skills.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 5} more
          </Badge>
        )}
      </div>
    );
  };

  const renderTaskDetails = (project: Project, tasks: Task[]) => {
    if (tasks.length === 0) {
      return <p className="text-sm text-muted-foreground">No tasks have been created for this project yet.</p>;
    }

    return (
      <div className="space-y-2 mt-2">
        {tasks.map(task => (
          <div key={task.id} className="border p-3 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium">{task.title}</h5>
                  <div className="flex items-center space-x-1">
                    {onTaskEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onTaskEdit(project, task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{task.description || 'No description'}</p>
              </div>
              <Badge>{task.status}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
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
                <p className="text-sm">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs font-medium mb-1">Skill Requirements</p>
                {renderSkillRequirements(task.skill_requirements)}
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
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-lg">{project.title}</h3>
                        <div className="flex items-center space-x-1">
                          {project.project_link && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => window.open(project.project_link, '_blank')}
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          )}
                          {onProjectEdit && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => onProjectEdit(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleProjectDeleted(project.project_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description || 'No description provided.'}
                      </p>
                      
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                        <p className="text-sm text-muted-foreground">
                          Status: {project.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Timeframe: {project.project_timeframe || 'Not specified'}
                        </p>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Required Skills</p>
                        {renderSkillRequirements(project.skills_required)}
                      </div>
                    </div>
                    
                    {toggleProjectExpanded && (
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleProjectExpanded(project.project_id)}
                      >
                        {expandedProjects?.has(project.project_id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {expandedProjects?.has(project.project_id) && (
                    <div className="p-4">
                      <h4 className="font-medium mb-2">Tasks</h4>
                      {renderTaskDetails(project, project.tasks)}
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
