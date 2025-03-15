
import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SkillRequirement {
  skill: string;
  level: string;
}

// Updated Task interface to maintain consistency with other components
interface Task {
  task_id: string;
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
  id?: string; // For backward compatibility
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
