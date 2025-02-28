
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectForm } from "./ProjectForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SubTaskForm } from "./SubTaskForm";
import { TaskList } from "./TaskList";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SkillRequirement {
  skill: string;
  level: string;
}

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
  skill_requirements: SkillRequirement[];
  dependencies: string[];
}

interface Project {
  project_id: string; // Changed from id to project_id
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

interface ProjectEditDialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (project: Project) => void;
}

export const ProjectEditDialog = ({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
}: ProjectEditDialogProps) => {
  const [showSubTaskForm, setShowSubTaskForm] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(project);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubTaskCreated = async (newTask: Task) => {
    if (!currentProject) return;
    
    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .insert({
          ...newTask,
          project_id: currentProject.project_id // Changed from currentProject.id
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
          business_id: currentProject.project_id, // Changed from currentProject.id
          open_to_recruiters: true,
        });

      const updatedProject = {
        ...currentProject,
        tasks: [...currentProject.tasks, data]
      };
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      setShowSubTaskForm(false);
      toast.success("Task added successfully");
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task");
    }
  };

  const handleProjectUpdate = async (updatedData: Partial<Project>) => {
    if (!project?.project_id) return; // Changed from project?.id
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          status: updatedData.status,
          equity_allocation: updatedData.equity_allocation,
          skills_required: updatedData.skills_required,
          project_timeframe: updatedData.project_timeframe
        })
        .eq('project_id', project.project_id) // Changed from 'id' to 'project_id'
        .select()
        .single();

      if (error) throw error;

      const updatedProject = { ...project, ...data };
      onProjectUpdated(updatedProject);
      toast.success("Project updated successfully");
      onClose();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    if (!currentProject) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Also delete corresponding business role
      await supabase
        .from('business_roles')
        .delete()
        .eq('business_id', currentProject.project_id) // Changed from currentProject.id
        .eq('title', currentProject.tasks.find(t => t.id === taskId)?.title);

      const updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.filter(task => task.id !== taskId)
      };
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    if (!currentProject) return;

    try {
      const { error } = await supabase
        .from('project_sub_tasks')
        .update(updatedTask)
        .eq('id', updatedTask.id);

      if (error) throw error;

      // Update corresponding business role
      await supabase
        .from('business_roles')
        .update({
          title: updatedTask.title,
          description: updatedTask.description
        })
        .eq('business_id', currentProject.project_id) // Changed from currentProject.id
        .eq('title', currentProject.tasks.find(t => t.id === updatedTask.id)?.title);

      const updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      };
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <ProjectForm
            initialData={project}
            onSubmit={handleProjectUpdate}
            submitLabel="Update Project"
          />

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Project Tasks</h3>
              <Button onClick={() => setShowSubTaskForm(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>

            {showSubTaskForm ? (
              <SubTaskForm
                projectId={project.project_id} // Changed from project.id
                availableSkills={project.skills_required}
                totalEquity={project.equity_allocation}
                currentTotalTaskEquity={project.tasks.reduce((sum, task) => sum + (task.equity_allocation || 0), 0)}
                onTaskCreated={handleSubTaskCreated}
                onCancel={() => setShowSubTaskForm(false)}
              />
            ) : (
              <TaskList
                projectId={project.project_id} // Changed from project.id
                tasks={currentProject?.tasks || []}
                onTaskDeleted={handleTaskDeleted}
                onTaskUpdated={handleTaskUpdated}
                availableSkills={project.skills_required}
                totalEquity={project.equity_allocation}
              />
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
