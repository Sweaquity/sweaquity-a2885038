
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
      // Fetch tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);
      
      if (ticketsError) throw ticketsError;
      
      // Fetch epics
      const { data: epics, error: epicsError } = await supabase
        .from('epics')
        .select('*')
        .eq('project_id', projectId);
      
      if (epicsError) throw epicsError;
      
      // Fetch milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId);
      
      if (milestonesError) throw milestonesError;

      // Process data for the Gantt chart
      const ganttTasks: Task[] = [];
      
      // Add project as the root task
      const { data: project, error: projectError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (projectError) throw projectError;

      // Start with project as the root
      ganttTasks.push({
        id: project.project_id,
        name: project.title,
        type: 'project',
        start: new Date(project.created_at || new Date()),
        end: calculateEndDate(tickets, epics, milestones),
        progress: calculateProgress(tickets),
        hideChildren: false,
        styles: { progressColor: '#1E40AF', progressSelectedColor: '#2563EB' },
        isDisabled: true
      });

      // Add epics as second level
      epics?.forEach(epic => {
        const epicTickets = tickets?.filter(ticket => ticket.epic_id === epic.id) || [];
        const epicStartDate = new Date(epic.created_at || new Date());
        const epicEndDate = epic.due_date ? new Date(epic.due_date) : calculateTicketsEndDate(epicTickets);
        
        ganttTasks.push({
          id: `epic-${epic.id}`,
          name: epic.title,
          type: 'project',
          start: epicStartDate,
          end: epicEndDate,
          progress: calculateEpicProgress(epicTickets),
          project: project.project_id,
          dependencies: [project.project_id],
          styles: { progressColor: '#4F46E5', progressSelectedColor: '#6366F1' }
        });
        
        // Add tickets for this epic
        epicTickets.forEach(ticket => {
          const startDate = new Date(ticket.created_at || new Date());
          let endDate;
          
          if (ticket.due_date) {
            endDate = new Date(ticket.due_date);
          } else if (ticket.estimated_hours) {
            // If no due date but has estimated hours, set end date based on that
            endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + ticket.estimated_hours);
          } else {
            // Default to 1 day if no due date or estimated hours
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
          }
          
          ganttTasks.push({
            id: `ticket-${ticket.id}`,
            name: ticket.title,
            type: 'task',
            start: startDate,
            end: endDate,
            progress: getTicketProgress(ticket.status),
            project: project.project_id,
            dependencies: [`epic-${epic.id}`],
            styles: { progressColor: '#059669', progressSelectedColor: '#10B981' }
          });
        });
      });
      
      // Add orphaned tickets (not part of any epic)
      const orphanedTickets = tickets?.filter(ticket => !ticket.epic_id) || [];
      orphanedTickets.forEach(ticket => {
        const startDate = new Date(ticket.created_at || new Date());
        let endDate;
        
        if (ticket.due_date) {
          endDate = new Date(ticket.due_date);
        } else if (ticket.estimated_hours) {
          endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + ticket.estimated_hours);
        } else {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        
        ganttTasks.push({
          id: `ticket-${ticket.id}`,
          name: ticket.title,
          type: 'task',
          start: startDate,
          end: endDate,
          progress: getTicketProgress(ticket.status),
          project: project.project_id,
          dependencies: [project.project_id],
          styles: { progressColor: '#059669', progressSelectedColor: '#10B981' }
        });
      });
      
      // Add milestones
      milestones?.forEach(milestone => {
        const milestoneDate = new Date(milestone.due_date || new Date());
        
        ganttTasks.push({
          id: `milestone-${milestone.id}`,
          name: milestone.title,
          type: 'milestone',
          start: milestoneDate,
          end: milestoneDate,
          progress: getMilestoneProgress(milestone.status),
          project: project.project_id,
          dependencies: [project.project_id],
          styles: { progressColor: '#DC2626', progressSelectedColor: '#EF4444' }
        });
      });
      
      setTasks(ganttTasks);
    } catch (error: any) {
      console.error('Error fetching project data for Gantt chart:', error);
      toast.error(error.message || "Failed to load Gantt chart data");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate the latest end date among all items
  const calculateEndDate = (tickets: any[] = [], epics: any[] = [], milestones: any[] = []) => {
    let latestDate = new Date();
    
    // Check tickets
    tickets?.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Check epics
    epics?.forEach(epic => {
      if (epic.due_date) {
        const dueDate = new Date(epic.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Check milestones
    milestones?.forEach(milestone => {
      if (milestone.due_date) {
        const dueDate = new Date(milestone.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    // Add a little buffer
    latestDate.setDate(latestDate.getDate() + 7);
    
    return latestDate;
  };

  // Helper function to calculate the end date for a group of tickets
  const calculateTicketsEndDate = (tickets: any[] = []) => {
    if (!tickets || tickets.length === 0) return new Date();
    
    let latestDate = new Date();
    
    tickets.forEach(ticket => {
      if (ticket.due_date) {
        const dueDate = new Date(ticket.due_date);
        if (dueDate > latestDate) latestDate = dueDate;
      }
    });
    
    return latestDate;
  };

  // Calculate overall project progress based on ticket completion
  const calculateProgress = (tickets: any[] = []) => {
    if (!tickets || tickets.length === 0) return 0;
    
    const completedTickets = tickets.filter(t => t.status === 'done').length;
    return Math.round((completedTickets / tickets.length) * 100) / 100; // Convert to decimal
  };

  // Calculate epic progress based on its tickets
  const calculateEpicProgress = (tickets: any[] = []) => {
    if (!tickets || tickets.length === 0) return 0;
    
    const completedTickets = tickets.filter(t => t.status === 'done').length;
    return Math.round((completedTickets / tickets.length) * 100) / 100;
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

  // Map milestone status to progress percentage
  const getMilestoneProgress = (status: string) => {
    switch(status) {
      case 'not_started': return 0;
      case 'in_progress': return 0.5;
      case 'completed': return 1;
      default: return 0;
    }
  };

  // Handle view mode changes
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
