import { useState, useEffect } from "react";
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
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  id?: string;
  task_id?: string;
  title: string;
  description?: string;
  status: string;
  equity_allocation: number;
  equity_earned?: number;
  equity_agreed?: number;
  timeframe?: string;
  skill_requirements: SkillRequirement[];
}

interface Project {
  id?: string;
  project_id?: string;
  title: string;
  description?: string;
  status?: string;
  equity_allocation: number;
  project_timeframe?: string;
  timeframe?: string;
  skills_required: string[];
  tasks: Task[];
}

interface ActiveRolesTableProps {
  project: Project;
}

export const ActiveRolesTable = ({ project }: ActiveRolesTableProps) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [tasksWithEarnings, setTasksWithEarnings] = useState<Task[]>(project.tasks);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [totalAgreedEquity, setTotalAgreedEquity] = useState<number>(0);
  const [totalEarnedEquity, setTotalEarnedEquity] = useState<number>(0);

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

  // Fetch application counts from the database
  useEffect(() => {
    const fetchApplicationCounts = async () => {
      const projectId = project.project_id || project.id;
      if (!projectId) return;
      
      try {
        // Fetch project application count
        const { data: projectApps, error: projectError } = await supabase
          .from('job_applications')
          .select('job_app_id')
          .eq('project_id', projectId);
          
        if (projectError) {
          console.error('Error fetching project applications:', projectError);
        } else {
          setApplicationCounts(prev => ({ 
            ...prev, 
            [projectId]: projectApps?.length || 0 
          }));
        }
        
        // Fetch task application counts
        for (const task of project.tasks) {
          const taskId = task.id || task.task_id;
          if (!taskId) continue;
          
          const { data: taskApps, error: taskError } = await supabase
            .from('job_applications')
            .select('job_app_id')
            .eq('task_id', taskId);
            
          if (taskError) {
            console.error(`Error fetching applications for task ${taskId}:`, taskError);
          } else {
            setApplicationCounts(prev => ({ 
              ...prev, 
              [taskId]: taskApps?.length || 0 
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching application counts:', error);
      }
    };
    
    fetchApplicationCounts();
  }, [project]);

  // Fetch task earnings data from Supabase
  useEffect(() => {
    const fetchTaskEarnings = async () => {
      const taskIds = project.tasks.map(task => task.id || task.task_id).filter(Boolean);
      if (taskIds.length === 0) return;
      
      try {
        // Get all applications for these tasks
        const { data: applications, error: appError } = await supabase
          .from('job_applications')
          .select('task_id, job_app_id')
          .in('task_id', taskIds);
          
        if (appError) {
          console.error('Error fetching job applications:', appError);
          return;
        }
        
        if (!applications || applications.length === 0) return;
        
        // Get accepted jobs for these applications
        const appIds = applications.map(app => app.job_app_id);
        const { data: acceptedJobs, error: jobsError } = await supabase
          .from('accepted_jobs')
          .select('job_app_id, equity_agreed')
          .in('job_app_id', appIds);
          
        if (jobsError) {
          console.error('Error fetching accepted jobs:', jobsError);
          return;
        }
        
        // Get time entries to calculate earnings based on hours
        const { data: timeEntries, error: timeError } = await supabase
          .from('time_entries')
          .select('ticket_id, job_app_id, hours_logged')
          .in('job_app_id', appIds);
          
        if (timeError) {
          console.error('Error fetching time entries:', timeError);
        }
        
        // Get ticket information to link tasks and time entries
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, task_id, estimated_hours')
          .in('task_id', taskIds);
          
        if (ticketsError) {
          console.error('Error fetching tickets:', ticketsError);
        }
        
        // Join accepted jobs with applications to get task-to-equity mapping
        const taskEquityMap = new Map<string, number>();
        let totalAgreed = 0;
        
        applications.forEach(app => {
          const acceptedJob = acceptedJobs?.find(job => job.job_app_id === app.job_app_id);
          if (acceptedJob && app.task_id) {
            // Get tasks with task completion from project_sub_tasks
            const previousValue = taskEquityMap.get(app.task_id) || 0;
            const newValue = previousValue + acceptedJob.equity_agreed;
            taskEquityMap.set(app.task_id, newValue);
            totalAgreed += acceptedJob.equity_agreed;
          }
        });
        
        setTotalAgreedEquity(totalAgreed);
        
        // Get completion percentage for each task
        const { data: subTasks, error: tasksError } = await supabase
          .from('project_sub_tasks')
          .select('task_id, completion_percentage, task_status')
          .in('task_id', taskIds);
          
        if (tasksError) {
          console.error('Error fetching tasks completion:', tasksError);
          return;
        }
        
        // Calculate earned equity based on multiple methods
        let totalEarned = 0;
        const updatedTasks = project.tasks.map(task => {
          const taskId = task.id || task.task_id;
          if (!taskId) return task;
          
          const acceptedEquity = taskEquityMap.get(taskId) || 0;
          const taskData = subTasks?.find(t => t.task_id === taskId);
          const taskStatus = taskData?.task_status || '';
          const completionPercentage = taskData?.completion_percentage || 0;
          
          // Get relevant ticket for this task
          const taskTicket = tickets?.find(t => t.task_id === taskId);
          const estimatedHours = taskTicket?.estimated_hours || 0;
          
          // Get time entries for this task's ticket
          let hoursLogged = 0;
          if (taskTicket) {
            const relevantTimeEntries = timeEntries?.filter(te => te.ticket_id === taskTicket.id) || [];
            hoursLogged = relevantTimeEntries.reduce((sum, entry) => sum + (entry.hours_logged || 0), 0);
          }
          
          // Calculate earned equity based on different methods:
          let earnedEquity = 0;
          
          if (taskStatus === 'completed' || taskStatus === 'closed') {
            // Method C: If task is completed/closed, full equity is earned
            earnedEquity = acceptedEquity;
          } else if (estimatedHours > 0 && hoursLogged > 0) {
            // Method A: Based on logged hours / estimated hours
            const hoursRatio = Math.min(hoursLogged / estimatedHours, 1);
            earnedEquity = acceptedEquity * hoursRatio;
          } else if (completionPercentage > 0) {
            // Method B: Based on completion percentage
            earnedEquity = acceptedEquity * (completionPercentage / 100);
          }
          
          totalEarned += earnedEquity;
          
          return {
            ...task,
            equity_earned: earnedEquity,
            equity_agreed: acceptedEquity
          };
        });
        
        setTotalEarnedEquity(totalEarned);
        setTasksWithEarnings(updatedTasks);
      } catch (error) {
        console.error('Error fetching task earnings data:', error);
      }
    };
    
    fetchTaskEarnings();
  }, [project.tasks]);

  const getApplicationCount = (id: string) => {
    return applicationCounts[id] || 0;
  };

  // Calculate totals
  const totalTaskEquity = project.tasks.reduce((sum, task) => 
    sum + (task.equity_allocation || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="border rounded-lg overflow-hidden">
        <div className="border-b cursor-pointer" onClick={() => toggleProject(project.project_id || project.id || '')}>
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
                      {getApplicationCount(project.project_id || project.id || '')}
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
                        <div className="text-sm">{totalTaskEquity.toFixed(2)}%</div>
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
                        <div className="text-sm">{totalAgreedEquity.toFixed(2)}%</div>
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
                        <div className="text-sm">{totalEarnedEquity.toFixed(2)}%</div>
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
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProject(project.project_id || project.id || '');
                }}
              >
                {expandedProjects.has(project.project_id || project.id || '') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {expandedProjects.has(project.project_id || project.id || '') && (
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Project Tasks</h3>
            
            {tasksWithEarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks available for this project.</p>
            ) : (
              <div className="space-y-4">
                {tasksWithEarnings.map((task: Task) => (
                  <Card key={task.id || task.task_id} className="overflow-hidden">
                    <div className="border-b cursor-pointer" onClick={() => toggleTask(task.id || task.task_id || '')}>
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
                                  {getApplicationCount(task.id || task.task_id || '')}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View applications for this task</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Badge 
                              variant="outline" 
                              className={
                                task.status === 'allocated'
                                  ? 'bg-green-100 text-green-800 border-green-200 mr-2'
                                  : 'bg-orange-100 text-orange-800 border-orange-200 mr-2'
                              }
                            >
                              {task.status}
                            </Badge>
                            <span>Timeframe: {task.timeframe || 'Not specified'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id || task.task_id || '');
                            }}
                          >
                            {expandedTasks.has(task.id || task.task_id || '') ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedTasks.has(task.id || task.task_id || '') && (
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
                                    <div className="text-sm">{(task.equity_agreed || 0).toFixed(2)}%</div>
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
                                    <div className="text-sm">{(task.equity_earned || 0).toFixed(2)}%</div>
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
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className={
                                        task.status === 'allocated' 
                                          ? 'bg-green-100 text-green-800 border-green-200 text-xs'
                                          : 'bg-orange-100 text-orange-800 border-orange-200 text-xs'
                                      }
                                    >
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
