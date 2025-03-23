
import React from "react";
import { Task, TaskType } from "@/types/types";

// Types
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: TaskType;
  progress: number;
  isDisabled: boolean;
  styles?: {
    progressColor?: string;
    backgroundColor?: string;
  };
}

export interface GanttChartProps {
  tasks: GanttTask[];
}

export enum TaskType {
  Task = 'task',
  Milestone = 'milestone'
  // Add other task types as needed
}


// Note: This is a wrapper component that will use the GanttChartView component
// from your original code. You'll need to implement or import that component.
export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  return (
    <div className="border rounded-lg overflow-hidden p-4">
      {/* Placeholder implementation for reference */}
      <div className="text-center p-4 bg-gray-50">
        <p>Gantt Chart View - Import your GanttChartView component here</p>
        <p className="text-sm text-gray-500">Tasks: {tasks.length}</p>
      </div>
    </div>
  );
};

// Helper function to convert ticket/item data to Gantt tasks
export const convertItemsToGanttTasks = (items: any[]): GanttTask[] => {
  return items.map((item) => {
    const startDate = new Date(item.created_at || item.createdAt);
    let endDate = item.due_date || item.dueDate ? new Date(item.due_date || item.dueDate) : new Date();
    
    if (!item.due_date && !item.dueDate || endDate < new Date()) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
    }
    
    const getProgressFromStatus = (status: string): number => {
      switch (status) {
        case 'done':
        case 'closed':
          return 100;
        case 'in-progress':
          return 50;
        case 'review':
          return 75;
        default:
          return 25;
      }
    };

    const getColorFromPriority = (priority: string): string => {
      switch (priority) {
        case 'high':
          return '#ef4444';
        case 'medium':
          return '#f59e0b';
        default:
          return '#3b82f6';
      }
    };
    
    return {
      id: item.id,
      name: item.title,
      start: startDate,
      end: endDate,
      type: item.type as TaskType || TaskType.Task,
      progress: getProgressFromStatus(item.status),
      isDisabled: false,
      styles: { 
        progressColor: getColorFromPriority(item.priority)
      }
    };
  });
};
