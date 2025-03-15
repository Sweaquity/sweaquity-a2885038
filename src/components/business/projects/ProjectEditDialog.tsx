
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectDialogHeader } from "./dialog/ProjectDialogHeader";
import { ProjectFormWrapper } from "./dialog/ProjectFormWrapper";
import { ProjectTasksSection } from "./dialog/ProjectTasksSection";
import { ProjectService } from "./services/ProjectService";
import { ProjectTaskService } from "./services/ProjectTaskService";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  task_id: string;  // Consistently use task_id
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
  project_id: string;
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
  const [currentProject, setCurrentProject] = useState<Project | null>(project);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubTaskCreated = async (newTask: Task) => {
    if (!currentProject) return;
    
    try {
      const data = await ProjectTaskService.createTask(newTask, currentProject.project_id);

      const updatedProject = {
        ...currentProject,
        tasks: [...currentProject.tasks, data]
      };
      
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      toast.success("Task added successfully");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleProjectUpdate = async (updatedData: Partial<Project>) => {
    if (!project?.project_id) return;
    
    setIsSubmitting(true);
    try {
      const updatedProject = await ProjectService.updateProject(project, updatedData);
      
      onProjectUpdated(updatedProject);
      toast.success("Project updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    if (!currentProject) return;

    try {
      await ProjectTaskService.deleteTask(taskId, currentProject.project_id, currentProject.tasks);

      const updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.filter(task => task.task_id !== taskId)
      };
      
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    if (!currentProject) return;

    try {
      await ProjectTaskService.updateTask(updatedTask, currentProject.project_id, currentProject.tasks);

      const updatedProject = {
        ...currentProject,
        tasks: currentProject.tasks.map(task => 
          task.task_id === updatedTask.task_id ? updatedTask : task
        )
      };
      
      setCurrentProject(updatedProject);
      onProjectUpdated(updatedProject);
      toast.success("Task updated successfully");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <ProjectDialogHeader />

        <div className="space-y-6">
          <ProjectFormWrapper 
            project={project} 
            onProjectUpdate={handleProjectUpdate} 
          />

          <ProjectTasksSection 
            project={project}
            currentProject={currentProject}
            onTaskCreated={handleSubTaskCreated}
            onTaskDeleted={handleTaskDeleted}
            onTaskUpdated={handleTaskUpdated}
          />
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
