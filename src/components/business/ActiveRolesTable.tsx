
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, Trash, ExternalLink, Users } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface ActiveRolesTableProps {
  project: any;
}

export const ActiveRolesTable = ({ project }: ActiveRolesTableProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
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

  const toggleTask = (taskId: string) => {
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

  // Mock function for application counts - in a real app, this would fetch from the database
  const getApplicationCount = (id: string, type: 'project' | 'task') => {
    // For demonstration purposes, just return a random number between 0 and 5
    return Math.floor(Math.random() * 6);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 text-sm text-muted-foreground">
        These are the projects with active applications on live projects, and the progress of completion of the projects.
      </div>
      
      <Card className="border rounded-lg overflow-hidden">
        <div className="border-b cursor-pointer" onClick={() => toggleProject(project.project_id || project.id)}>
          <div className="p-4 flex flex-col md:flex-row justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <Link 
                  to={`/projects/${project.project_id || project.id}`}
                  className="text-blue-600 hover:underline text-lg font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.title}
                </Link>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to={`/business/applications?project=${project.project_id || project.id}`}
                      className="ml-2 flex items-center text-sm text-blue-500 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {getApplicationCount(project.project_id || project.id, 'project')}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">View applications for this project</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center flex-wrap text-muted-foreground text-sm mt-1">
                <span className="mr-4">Status: {project.status || "Active"}</span>
                <span>Timeframe: {project.project_timeframe || project.timeframe || 'Not specified'}</span>
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
                          {project.tasks.reduce((sum: number, task: any) => 
                            sum + (task.equity_allocation || 0), 0)}%
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
                        <div className="text-sm">0%</div>
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
                        <div className="text-sm">0%</div>
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
                  {Array.isArray(project.skills_required) && project.skills_required.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(!Array.isArray(project.skills_required) || project.skills_required.length === 0) && (
                    <span className="text-muted-foreground text-xs">No skills specified</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  // Edit project logic would go here
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  // Delete project logic would go here 
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProject(project.project_id || project.id);
                }}
              >
                {expandedProjects.has(project.project_id || project.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {expandedProjects.has(project.project_id || project.id) && (
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Project Tasks</h3>
            
            {project.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks available for this project.</p>
            ) : (
              <div className="space-y-4">
                {project.tasks.map((task: any) => (
                  <Card key={task.id || task.task_id} className="overflow-hidden">
                    <div className="border-b cursor-pointer" onClick={() => toggleTask(task.id || task.task_id)}>
                      <div className="p-3 flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="font-medium">{task.title}</div>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link 
                                  to={`/business/applications?task=${task.id || task.task_id}`}
                                  className="ml-2 flex items-center text-sm text-blue-500 hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  {getApplicationCount(task.id || task.task_id, 'task')}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View applications for this task</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="mr-2">{task.status}</Badge>
                            <span>Timeframe: {task.timeframe || 'Not specified'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id || task.task_id);
                            }}
                          >
                            {expandedTasks.has(task.id || task.task_id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedTasks.has(task.id || task.task_id) && (
                      <div className="p-3 bg-gray-50 border-t">
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
                                    <div className="text-sm">0%</div>
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
                                    <div className="text-sm">0%</div>
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
                                task.skill_requirements.map((skill: any, index: number) => {
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
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
