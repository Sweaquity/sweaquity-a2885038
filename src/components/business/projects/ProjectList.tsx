
import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Updated SkillRequirement interface to ensure consistency across components
interface SkillRequirement {
  skill: string;
  level: string;
}

// Updated Task interface to ensure consistency across components
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
  skills_required: string[]; // Make this required to match other Task interface
  skill_requirements: SkillRequirement[];
  dependencies: string[];
}

// Updated Project interface to ensure consistency
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

interface ProjectListProps {
  projects: Project[];
  onProjectUpdated: (project: Project) => void;
  onProjectDeleted: (projectId: string) => void;
}

export const ProjectList = ({ projects, onProjectUpdated, onProjectDeleted }: ProjectListProps) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  return (
    <>
      <div className="space-y-6">
        {projects.map(project => (
          <ProjectCard
            key={project.project_id}
            project={project}
            onEdit={setEditingProject}
            onDelete={onProjectDeleted}
          />
        ))}
      </div>

      <ProjectEditDialog
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onProjectUpdated={(updatedProject) => {
          onProjectUpdated(updatedProject);
          setEditingProject(null);
        }}
      />
    </>
  );
};
