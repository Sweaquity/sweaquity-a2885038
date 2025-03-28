import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { ProjectTabs } from "./projects/tabs/ProjectTabs";
import { DeleteProjectDialog } from "./projects/dialogs/DeleteProjectDialog";
import { loadProjects, deleteProject } from "./projects/services/ProjectSectionService";
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

interface EquityStats {
  taskEquityTotal: number;
  agreedEquityTotal: number;
  earnedEquityTotal: number;
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [equityStats, setEquityStats] = useState<Record<string, EquityStats>>({});

  useEffect(() => {
    loadProjectsData();
  }, []);

  const loadProjectsData = async () => {
    try {
      const projectsData = await loadProjects();
      setProjects(projectsData);
      
      // Calculate equity statistics for each project
      const stats: Record<string, EquityStats> = {};
      
      for (const project of projectsData) {
        try {
          // Sum task equity
          const taskEquityTotal = project.tasks.reduce(
            (sum, task) => sum + (task.equity_allocation || 0), 0
          );
          
          // Get accepted jobs data for this project
          const { data: acceptedJobs, error } = await supabase
            .from('accepted_jobs')
            .select('job_app_id, equity_agreed, jobs_equity_allocated')
            .eq('project_id', project.project_id);
            
          if (error) {
            console.error(`Error fetching equity data for project ${project.project_id}:`, error);
            continue;
          }
            
          // Sum agreed and earned equity
          const agreedEquityTotal = acceptedJobs?.reduce(
            (sum, job) => sum + (job.equity_agreed || 0), 0
          ) || 0;
          
          const earnedEquityTotal = acceptedJobs?.reduce(
            (sum, job) => sum + (job.jobs_equity_allocated || 0), 0
          ) || 0;
          
          stats[project.project_id] = {
            taskEquityTotal,
            agreedEquityTotal,
            earnedEquityTotal
          };
        } catch (error) {
          console.error(`Error calculating equity stats for project ${project.project_id}:`, error);
        }
      }
      
      setEquityStats(stats);
    } catch (error) {
      toast.error("Failed to load projects", {
        description: "There was an error retrieving project data."
      });
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, { ...newProject, tasks: [] }]);
    setShowProjectForm(false);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.project_id === updatedProject.project_id ? updatedProject : project
    ));
    
    // Recalculate equity stats for the updated project
    loadProjectsData();
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.project_id !== projectId));
    
    // Remove equity stats for the deleted project
    setEquityStats(prev => {
      const newStats = {...prev};
      delete newStats[projectId];
      return newStats;
    });
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
          equityStats={equityStats}
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
