
import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { ProjectEditDialog } from "./ProjectEditDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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
  id: string;
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

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('business_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      onProjectDeleted(projectId);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
    }
  };

  return (
    <>
      <div className="space-y-6">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={setEditingProject}
            onDelete={handleDeleteProject}
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
