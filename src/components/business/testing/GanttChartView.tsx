import React, { useState, useEffect } from 'react';
import { Gantt, Task, ViewMode, StylingOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface GanttChartViewProps {
  projectId?: string;
  tasks?: Task[];
}

export const GanttChartView = ({ tasks: propTasks, projectId }: GanttChartViewProps) => {
  const [view, setView] = useState<ViewMode>(ViewMode.Day);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);
    } 
    else if (projectId) {
      fetchTasksFromProject(projectId);
    }
  }, [projectId, propTasks]);
  
  const fetchTasksFromProject = async (projectId: string) => {
    setLoading(true);
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (taskError) throw taskError;
      
      if (taskData && taskData.length > 0) {
        const ganttTasks: Task[] = taskData.map((task) => {
          const start = task.created_at ? new Date(task.created_at) : new Date();
          let end = new Date(start);
          if (task.timeframe) {
            const timeframe = task.timeframe.toLowerCase();
            if (timeframe.includes('week')) {
              const weeks = parseInt(timeframe) || 1;
              end.setDate(end.getDate() + (weeks * 7));
            } else if (timeframe.includes('month')) {
              const months = parseInt(timeframe) || 1;
              end.setMonth(end.getMonth() + months);
            } else if (timeframe.includes('day')) {
              const days = parseInt(timeframe) || 1;
              end.setDate(end.getDate() + days);
            } else {
              end.setDate(end.getDate() + 7);
            }
          } else {
            end.setDate(end.getDate() + 7);
          }
          
          return {
            id: task.task_id,
            name: task.title,
            start,
            end,
            progress: task.completion_percentage ? task.completion_percentage / 100 : 0,
            type: 'task',
            isDisabled: false,
            styles: { progressColor: '#2196F3', progressSelectedColor: '#1976D2' }
          };
        });
        
        setTasks(ganttTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks for Gantt chart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Loading Gantt chart data...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No tasks available for Gantt chart view.</p>
        </CardContent>
      </Card>
    );
  }

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const customStyling: StylingOption = {
    headerHeight: 40,
    rowHeight: 35,
    columnWidth: 40,
    listCellWidth: '100px',
    fontFamily: 'inherit',
  };

  const customTooltipContent = ({ task }: { task: Task; fontSize: string; fontFamily: string }) => {
    if (!task || !task.start || !task.end) {
      return <div>Invalid task data</div>;
    }
    
    const startDate = task.start.toLocaleDateString();
    const endDate = task.end.toLocaleDateString();
    
    return (
      <div style={{ padding: '8px', background: 'white', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight: 'bold' }}>{task.name}</div>
        <div style={{ marginTop: '4px' }}>Start: {startDate}</div>
        <div>End: {endDate}</div>
        <div>Progress: {Math.round(task.progress * 100)}%</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ overflowX: 'auto', height: 'calc(100vh - 300px)' }}>
        <Gantt
          tasks={tasks}
          viewMode={view}
          onDateChange={() => {}}
          onProgressChange={() => {}}
          onClick={handleTaskClick}
          columnWidth={40}
          listCellWidth="100px"
          rowHeight={35}
          headerHeight={40}
          todayColor="#FF9800"
          projectProgressColor="#4CAF50"
          progressColor="#2196F3"
          arrowColor="#9E9E9E"
          fontFamily="inherit"
          TooltipContent={customTooltipContent}
          stylingOption={customStyling}
        />
      </div>
    </div>
  );
};
