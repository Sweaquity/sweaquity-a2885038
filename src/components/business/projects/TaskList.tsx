
import { useState } from "react";
import { Clock, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubTaskForm } from "./SubTaskForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: any[];
  dependencies: string[];
}

interface TaskListProps {
  projectId: string;
  tasks: Task[];
  onTaskDeleted: (taskId: string) => void;
  onTaskUpdated: (task: Task) => void;
  availableSkills: string[];
  totalEquity: number;
}

export const TaskList = ({ 
  projectId,
  tasks,
  onTaskDeleted,
  onTaskUpdated,
  availableSkills,
  totalEquity
}: TaskListProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      onTaskDeleted(taskId);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
    }
  };

  const currentTotalTaskEquity = tasks.reduce(
    (sum, task) => sum + (task.equity_allocation || 0), 
    0
  );

  return (
    <>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-muted-foreground">{task.description}</p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Required Skills:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.skill_requirements.map((skillReq: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-secondary rounded-full text-xs">
                        {skillReq.skill} - {skillReq.level}
                      </span>
                    ))}
                  </div>
                </div>
                {task.dependencies.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Dependencies:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.dependencies.map(dep => (
                        <span key={dep} className="px-2 py-1 bg-secondary rounded-full text-xs">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right mt-2">
                  <div className="flex items-center space-x-2 justify-end">
                    <Clock className="h-4 w-4" />
                    <span>Due: {task.timeframe}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Equity allocated: {task.equity_allocation}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <SubTaskForm
              projectId={projectId}
              availableSkills={availableSkills}
              totalEquity={totalEquity}
              currentTotalTaskEquity={currentTotalTaskEquity - editingTask.equity_allocation}
              onTaskCreated={onTaskUpdated}
              onCancel={() => setEditingTask(null)}
              initialData={editingTask}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
