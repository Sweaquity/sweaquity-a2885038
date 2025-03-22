
import React, { useState } from 'react';
import { Gantt, Task, ViewMode, StylingOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Card, CardContent } from '@/components/ui/card';

interface GanttChartViewProps {
  tasks: Task[];
  projectId?: string;
}

export const GanttChartView = ({ tasks, projectId }: GanttChartViewProps) => {
  const [view, setView] = useState<ViewMode>(ViewMode.Day);
  
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

  // Custom styling to make the Gantt chart more space-efficient
  const customStyling: StylingOption = {
    headerHeight: 40,
    rowHeight: 35,
    columnWidth: 60,
    listCellWidth: '120px', // Make the name column narrower
    fontFamily: 'inherit',
  };

  // Format tooltip to show date information on hover
  const customTooltip = (task: Task) => {
    const startDate = task.start.toLocaleDateString();
    const endDate = task.end.toLocaleDateString();
    return `
      <div style="padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        <div style="font-weight: bold;">${task.name}</div>
        <div style="margin-top: 4px;">Start: ${startDate}</div>
        <div>End: ${endDate}</div>
        <div>Progress: ${task.progress}%</div>
      </div>
    `;
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
          columnWidth={60}
          listCellWidth="120px"
          rowHeight={35}
          headerHeight={40}
          todayColor="#FF9800"
          projectProgressColor="#4CAF50"
          progressColor="#2196F3"
          arrowColor="#9E9E9E"
          fontFamily="inherit"
          TooltipContent={customTooltip}
          stylingOption={customStyling}
        />
      </div>
    </div>
  );
};
