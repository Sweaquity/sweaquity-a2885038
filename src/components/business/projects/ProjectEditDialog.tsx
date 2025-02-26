import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "./ProjectForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SubTaskForm } from "./SubTaskForm";
import { TaskList } from "./TaskList";
import { PlusCircle } from "lucide-react";
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
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: any[];
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

  const handleSubTaskCreated = (newTask: any) => {
    if (!currentProject) return;
    
    const updatedProject = {
      ...currentProject,
      tasks: [...currentProject.tasks, newTask]
    };
    setCurrentProject(updatedProject);
    onProjectUpdated(updatedProject);
    setShowSubTaskForm(false);
    toast.success("Task added successfully");
  };

  const handleProjectUpdate = async (updatedData: any) => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .update(updatedData)
        .eq('id', project?.id)
        .select()
        .single();

      if (error) throw error;

      onProjectUpdated(data);
      toast.success("Project updated successfully");
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error("Failed to update project");
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
                projectId={project.id}
                availableSkills={project.skills_required}
                totalEquity={project.equity_allocation}
                currentTotalTaskEquity={project.tasks.reduce((sum, task) => sum + (task.equity_allocation || 0), 0)}
                onTaskCreated={handleSubTaskCreated}
                onCancel={() => setShowSubTaskForm(false)}
              />
            ) : (
              <TaskList
                projectId={project.id}
                tasks={currentProject?.tasks || []}
                onTaskDeleted={handleTaskDeleted}
                onTaskUpdated={handleTaskUpdated}
                availableSkills={project.skills_required}
                totalEquity={project.equity_allocation}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
