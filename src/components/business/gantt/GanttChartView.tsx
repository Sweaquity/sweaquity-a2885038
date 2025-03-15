
import React from 'react';

interface GanttTask {
  id: string;
  task: string;
  start: Date;
  end: Date;
  progress: number;
  type: string;
  project: string;
}

export interface GanttChartViewProps {
  ganttTasks: GanttTask[];
}

export const GanttChartView: React.FC<GanttChartViewProps> = ({ ganttTasks }) => {
  if (!ganttTasks || ganttTasks.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-lg">
        <h3 className="text-lg font-medium mb-2">No Tasks To Display</h3>
        <p className="text-muted-foreground">
          There are no tasks available for the Gantt chart view.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-medium mb-4">Project Timeline</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Task</th>
              <th className="py-2 px-4 text-left">Project</th>
              <th className="py-2 px-4 text-left">Start</th>
              <th className="py-2 px-4 text-left">End</th>
              <th className="py-2 px-4 text-left">Progress</th>
            </tr>
          </thead>
          <tbody>
            {ganttTasks.map(task => (
              <tr key={task.id} className="border-b hover:bg-muted/10">
                <td className="py-2 px-4">{task.task}</td>
                <td className="py-2 px-4">{task.project}</td>
                <td className="py-2 px-4">{task.start.toLocaleDateString()}</td>
                <td className="py-2 px-4">{task.end.toLocaleDateString()}</td>
                <td className="py-2 px-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.progress}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
