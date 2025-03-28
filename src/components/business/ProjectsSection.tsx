
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { ProjectTabs } from "./projects/tabs/ProjectTabs";
import { DeleteProjectDialog } from "./projects/dialogs/DeleteProjectDialog";
import { loadProjects, deleteProject } from "./projects/services/ProjectSectionService";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  id: string;
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
}

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  equity_allocated: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProjectsData();
  }, []);

  const loadProjectsData = async () => {
    const projectsData = await loadProjects();
    setProjects(projectsData);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, { ...newProject, tasks: [] }]);
    setShowProjectForm(false);
    toast.success("Project created successfully");
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.project_id === updatedProject.project_id ? updatedProject : project
    ));
    toast.success("Project updated successfully");
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.project_id !== projectId));
    toast.success("Project deleted successfully");
  };

  const showDeleteConfirmation = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      const success = await deleteProject(projectToDelete, projects);
      if (success) {
        handleProjectDeleted(projectToDelete);
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Projects & Tasks</h2>
        <Button onClick={() => setShowProjectForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </CardHeader>
      <CardContent>
        <ProjectTabs
          projects={projects}
          showProjectForm={showProjectForm}
          setShowProjectForm={setShowProjectForm}
          handleProjectCreated={handleProjectCreated}
          handleProjectUpdated={handleProjectUpdated}
          handleProjectDeleted={showDeleteConfirmation}
        />
      </CardContent>
      
      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
      />
    </Card>
  );
};
