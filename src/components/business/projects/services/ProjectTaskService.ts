
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Task {
  task_id: string;  // Changed from id to task_id
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skill_requirements: any[];
  dependencies: string[];
}

export const ProjectTaskService = {
  createTask: async (newTask: Task, projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .insert({
          ...newTask,
          project_id: projectId
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a corresponding business role
      await supabase
        .from('business_roles')
        .insert({
          title: newTask.title,
          description: newTask.description,
          business_id: projectId,
          open_to_recruiters: true,
        });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },
  
  updateTask: async (updatedTask: Task, projectId: string, currentProjectTasks: Task[]) => {
    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update(updatedTask)
        .eq('task_id', updatedTask.task_id);  // Changed from id to task_id

      if (error) throw error;

      // Update corresponding business role
      await supabase
        .from('business_roles')
        .update({
          title: updatedTask.title,
          description: updatedTask.description
        })
        .eq('business_id', projectId)
        .eq('title', currentProjectTasks.find(t => t.task_id === updatedTask.task_id)?.title);  // Changed from id to task_id

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  deleteTask: async (taskId: string, projectId: string, currentProjectTasks: Task[]) => {
    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .delete()
        .eq('task_id', taskId);  // Changed from id to task_id

      if (error) throw error;

      // Also delete corresponding business role
      await supabase
        .from('business_roles')
        .delete()
        .eq('business_id', projectId)
        .eq('title', currentProjectTasks.find(t => t.id === taskId)?.title);

      return taskId;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};
