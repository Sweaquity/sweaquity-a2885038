import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Link } from "lucide-react";
import { toast } from "sonner";
import { ProjectTabs } from "./projects/tabs/ProjectTabs";
import { DeleteProjectDialog } from "./projects/dialogs/DeleteProjectDialog";
import { ProjectEditDialog } from "./projects/dialogs/ProjectEditDialog"; // Assume this will be created
import { TaskEditDialog } from "./projects/dialogs/TaskEditDialog"; // Assume this will be created
import { loadProjects, deleteProject, updateProject } from "./projects/services/ProjectSectionService";

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
  due_date?: string;
  skills_required: string[];
  skill_requirements: SkillRequirement[];
  dependencies: string[];
}

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  project_link?: string;
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
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<{project: Project, task: Task} | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.project_id === updatedProject.project_id ? updatedProject : project
    ));
    setProjectToEdit(null);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.project_id !== projectId));
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
        toast.success("Project deleted successfully");
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
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
          
          // New props for editing
          onProjectEdit={(project) => setProjectToEdit(project)}
          onTaskEdit={(project, task) => setTaskToEdit({project, task})}
          expandedProjects={expandedProjects}
          toggleProjectExpanded={toggleProjectExpanded}
        />
      </CardContent>
      
      <DeleteProjectDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={confirmDeleteProject}
      />

      {projectToEdit && (
        <ProjectEditDialog
          project={projectToEdit}
          isOpen={!!projectToEdit}
          onOpenChange={() => setProjectToEdit(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {taskToEdit && (
        <TaskEditDialog
          project={taskToEdit.project}
          task={taskToEdit.task}
          isOpen={!!taskToEdit}
          onOpenChange={() => setTaskToEdit(null)}
          onTaskUpdated={(updatedProject) => {
            handleProjectUpdated(updatedProject);
            setTaskToEdit(null);
          }}
        />
      )}
    </Card>
  );
};
