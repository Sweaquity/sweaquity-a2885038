
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useEffect, useState } from "react";
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
  equity_allocation: number;
  equity_earned?: number;
  timeframe: string;
  skill_requirements: SkillRequirement[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  equity_allocation: number;
  skills_required: string[];
  tasks: Task[];
}

interface ActiveRolesTableProps {
  project: Project;
}

export const ActiveRolesTable = ({ project }: ActiveRolesTableProps) => {
  const [tasksWithEarnings, setTasksWithEarnings] = useState<Task[]>(project.tasks);
  
  useEffect(() => {
    // Fetch earned equity data for each task
    const fetchTaskEarnings = async () => {
      const taskIds = project.tasks.map(task => task.id);
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
        applications.forEach(app => {
          const acceptedJob = acceptedJobs?.find(job => job.job_app_id === app.job_app_id);
          if (acceptedJob && app.task_id) {
            // Get tasks with task completion from project_sub_tasks
            taskEquityMap.set(app.task_id, acceptedJob.equity_agreed);
          }
        });
        
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
        const updatedTasks = project.tasks.map(task => {
          const acceptedEquity = taskEquityMap.get(task.id) || 0;
          const taskData = subTasks?.find(t => t.task_id === task.id);
          const taskStatus = taskData?.task_status || '';
          const completionPercentage = taskData?.completion_percentage || 0;
          
          // Get relevant ticket for this task
          const taskTicket = tickets?.find(t => t.task_id === task.id);
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
          
          return {
            ...task,
            equity_earned: earnedEquity
          };
        });
        
        setTasksWithEarnings(updatedTasks);
      } catch (error) {
        console.error('Error fetching task earnings data:', error);
      }
    };
    
    fetchTaskEarnings();
  }, [project.tasks]);
  
  const totalClaimedEquity = tasksWithEarnings.reduce((sum, task) => sum + (task.equity_allocation || 0), 0);
  const totalEarnedEquity = tasksWithEarnings.reduce((sum, task) => sum + (task.equity_earned || 0), 0);
  const remainingEquity = project.equity_allocation - totalClaimedEquity;

  return (
    <div className="space-y-4">
      {/* Project Level Information */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Project</TableHead>
            <TableHead className="w-[10%]">Number of Tasks</TableHead>
            <TableHead className="w-[25%]">Required Skills</TableHead>
            <TableHead className="w-[10%]">Total Equity</TableHead>
            <TableHead className="w-[10%]">Equity Offered</TableHead>
            <TableHead className="w-[10%]">Equity Earned</TableHead>
            <TableHead className="w-[15%]">Remaining Equity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">
              <Link 
                to={`/projects/${project.id}`}
                className="text-blue-600 hover:underline hover:text-blue-800"
              >
                {project.title}
              </Link>
            </TableCell>
            <TableCell>{project.tasks.length}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {project.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{project.equity_allocation}%</TableCell>
            <TableCell>{totalClaimedEquity.toFixed(2)}%</TableCell>
            <TableCell>{totalEarnedEquity.toFixed(2)}%</TableCell>
            <TableCell>{remainingEquity.toFixed(2)}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Tasks Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Task</TableHead>
              <TableHead className="w-[25%]">Description</TableHead>
              <TableHead className="w-[25%]">Required Skills</TableHead>
              <TableHead className="w-[10%]">Equity Offered</TableHead>
              <TableHead className="w-[10%]">Equity Earned</TableHead>
              <TableHead className="w-[10%]">Timeframe</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksWithEarnings.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div className="line-clamp-2">
                    {task.description}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {task.skill_requirements.map((skillReq, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className={
                          task.status === 'allocated' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }
                      >
                        {skillReq.skill} - {skillReq.level}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{task.equity_allocation}%</TableCell>
                <TableCell>{(task.equity_earned || 0).toFixed(2)}%</TableCell>
                <TableCell>{task.timeframe}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={
                      task.status === 'allocated'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-orange-100 text-orange-800 border-orange-200'
                    }
                  >
                    {task.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
