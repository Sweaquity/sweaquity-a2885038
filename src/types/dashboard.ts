
export type TaskType = 'task' | 'milestone' | 'project';

export interface Task {
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

export interface KanbanColumn {
  id: string;
  title: string;
  ticketIds: string[];
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}
