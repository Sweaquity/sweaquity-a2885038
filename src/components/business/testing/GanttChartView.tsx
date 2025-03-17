
import React, { useState, useEffect } from 'react';
import { Gantt, ViewMode, Task } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface GanttChartViewProps {
  projectId: string | null;
}

export function GanttChartView({ projectId }: GanttChartViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      console.log("Fetching project data for Gantt chart with project ID:", projectId);
      
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      // Fetch project sub-tasks
      const { data: subTasks, error: subTasksError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
      
      if (subTasksError) throw subTasksError;
      
      // Fetch tickets associated with this project's tasks
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);
      
      if (ticketsError) throw ticketsError;
      
      // Fetch milestones (if you have a milestones table)
      // For now, we'll handle sub-tasks with specific status as milestones
      const milestones = subTasks?.filter(task => task.task_status === 'milestone') || [];

      // Process data for the Gantt chart
      const ganttTasks: Task[] = [];
      
      // Start with project as the root
      ganttTasks.push({
        id: project.project_id,
        name: project.title,
        type: 'project',
        start: new Date(project.created_at || new Date()),
        end: calculateEndDate(subTasks, milestones, tickets),
        progress: calculateProgress(subTasks),
        hideChildren: false,
        styles: { progressColor: '#1E40AF', progressSelectedColor: '#2563EB' },
        isDisabled: true
      });

      // Add sub-tasks as second level items
      subTasks?.forEach(task => {
        const taskTickets = tickets?.filter(ticket => ticket.task_id === task.task_id) || [];
        const taskStartDate = new Date(task.created_at || new Date());
        let taskEndDate;
        
        if (task.timeframe && task.timeframe.includes("-")) {
          const timeframeParts = task.timeframe.split("-");
          if (timeframeParts.length > 1 && timeframeParts[1].trim()) {
            try {
              taskEndDate = new Date(timeframeParts[1].trim());
            } catch (e) {
              // If date parsing fails, use calculated end date
              taskEndDate = calculateTicketsEndDate(taskTickets) || addDaysToDate(taskStartDate, 30);
            }
          } else {
            taskEndDate = calculateTicketsEndDate(taskTickets) || addDaysToDate(taskStartDate, 30);
          }
        } else {
          taskEndDate = calculateTicketsEndDate(taskTickets) || addDaysToDate(taskStartDate, 30);
        }
        
        // Determine if this is a regular task or a milestone
        const taskType = task.task_status === 'milestone' ? 'milestone' : 'task';
        
        ganttTasks.push({
          id: `task-${task.task_id}`,
          name: task.title,
          type: taskType,
          start: taskStartDate,
          end: taskType === 'milestone' ? taskStartDate : taskEndDate,
          progress: calculateTaskProgress(task),
          project: project.project_id,
          dependencies: [project.project_id],
          styles: { progressColor: '#059669', progressSelectedColor: '#10B981' }
        });
        
        // Add tickets for this task if it's not a milestone
        if (taskType !== 'milestone') {
          taskTickets.forEach(ticket => {
            const ticketStartDate = new Date(ticket.created_at || new Date());
            let ticketEndDate;
            
            if (ticket.due_date) {
              ticketEndDate = new Date(ticket.due_date);
            } else if (ticket.estimated_hours) {
              ticketEndDate = addHoursToDate(ticketStartDate, ticket.estimated_hours);
            } else {
              ticketEndDate = addDaysToDate(ticketStartDate, 1);
            }
            
            ganttTasks.push({
              id: `ticket-${ticket.id}`,
              name: ticket.title,
              type: 'task',
              start: ticketStartDate,
              end: ticketEndDate,
              progress: getTicketProgress(ticket.status),
              project: project.project_id,
              dependencies: [`task-${task.task_id}`],
              styles: { progressColor: '#4F46E5', progressSelectedColor: '#6366F1' }
            });
          });
        }
      });
      
      setTasks(ganttTasks);
    } catch (error: any) {
      console.error('Error fetching project data for Gantt chart:', error);
      toast.error(error.message || "Failed to load Gantt chart data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add days to a date
  const addDaysToDate = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  // Helper function to add hours to a date
  const addHoursToDate = (date: Date, hours: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };

  // Helper function to calculate the latest end date
  const calculateEndDate = (tasks: any[] = [], milestones: any[] = [], tickets: any[] = []) => {
    let latestDate = new Date();
    
    // Check tasks
    tasks?.forEach(task => {
      if (task.timeframe && task.timeframe.includes("-")) {
        const timeframeParts = task.timeframe.split("-");
        if (timeframeParts.length > 1 && timeframeParts[1].trim()) {
          try {
            const endDate = new Date(timeframeParts[1].trim());
            if (endDate > latestDate) latestDate = endDate;
          } catch (e) {
            // Skip invalid dates
          }
        }
      }
    });
    
    // Check tickets
    tickets?.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Add buffer
    latestDate.setDate(latestDate.getDate() + 7);
    return latestDate;
  };

  // Calculate task progress based on completion_percentage
  const calculateTaskProgress = (task: any) => {
    return task.completion_percentage ? task.completion_percentage / 100 : 0;
  };

  // Calculate overall project progress based on sub-tasks completion
  const calculateProgress = (tasks: any[] = []) => {
    if (!tasks || tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.completion_percentage || 0), 0);
    return Math.round((totalProgress / tasks.length) / 100 * 100) / 100;
  };

  // Helper function to calculate the end date for tickets
  const calculateTicketsEndDate = (tickets: any[] = []) => {
    if (!tickets || tickets.length === 0) return null;
    
    let latestDate = new Date();
    tickets.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    return latestDate;
  };

  // Map ticket status to progress percentage
  const getTicketProgress = (status: string) => {
    switch(status) {
      case 'backlog': return 0;
      case 'todo': return 0;
      case 'in_progress': return 0.5;
      case 'review': return 0.8;
      case 'done': return 1;
      default: return 0;
    }
  };

  const handleViewModeChange = (value: string) => {
    switch(value) {
      case 'day':
        setViewMode(ViewMode.Day);
        break;
      case 'week':
        setViewMode(ViewMode.Week);
        break;
      case 'month':
        setViewMode(ViewMode.Month);
        break;
      case 'year':
        setViewMode(ViewMode.Year);
        break;
      default:
        setViewMode(ViewMode.Month);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading Gantt chart data...</div>;

  if (!projectId) return <div className="text-center p-8">Please select a project to view the Gantt chart.</div>;

  if (tasks.length === 0) return <div className="text-center p-8">No tasks found for this project.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Select 
          defaultValue={ViewMode.Month.toString()} 
          onValueChange={handleViewModeChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="View Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="gantt-container" style={{ height: '500px', width: '100%', overflow: 'auto' }}>
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              onDateChange={(task) => console.log("Date changed", task)}
              onProgressChange={(task) => console.log("Progress changed", task)}
              onDoubleClick={(task) => console.log("Task clicked", task)}
              listCellWidth="250px"
              columnWidth={viewMode === ViewMode.Year ? 350 : viewMode === ViewMode.Month ? 300 : 200}
              todayColor="#F43F5E"
              barCornerRadius={4}
              barFill={80}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
