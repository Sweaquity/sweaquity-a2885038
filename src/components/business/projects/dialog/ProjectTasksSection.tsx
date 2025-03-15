
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SubTaskForm } from "../SubTaskForm";
import { TaskList } from "../TaskList";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  task_id: string;
  id?: string; // For backward compatibility
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required?: string[];
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

interface ProjectTasksSectionProps {
  project: Project;
  currentProject: Project | null;
  onTaskCreated: (newTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskUpdated: (updatedTask: Task) => void;
}

export const ProjectTasksSection = ({
  project,
  currentProject,
  onTaskCreated,
  onTaskDeleted,
  onTaskUpdated
}: ProjectTasksSectionProps) => {
  const [showSubTaskForm, setShowSubTaskForm] = useState(false);
  
  return (
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
          projectId={project.project_id}
          availableSkills={project.skills_required}
          totalEquity={project.equity_allocation}
          currentTotalTaskEquity={project.tasks.reduce((sum, task) => sum + (task.equity_allocation || 0), 0)}
          onTaskCreated={onTaskCreated}
          onCancel={() => setShowSubTaskForm(false)}
        />
      ) : (
        <TaskList
          projectId={project.project_id}
          tasks={currentProject?.tasks || []}
          onTaskDeleted={onTaskDeleted}
          onTaskUpdated={onTaskUpdated}
          availableSkills={project.skills_required}
          totalEquity={project.equity_allocation}
        />
      )}
    </div>
  );
};
