
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectList } from "./projects/ProjectList";
import { ProjectForm } from "./projects/ProjectForm";

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
  tasks: Task[];
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*');

      if (projectsError) throw projectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('project_sub_tasks')
        .select('*');

      if (tasksError) throw tasksError;

      const projectsWithTasks = projectsData.map((project: any) => ({
        ...project,
        tasks: tasksData.filter((task: any) => task.project_id === project.id) || []
      }));

      setProjects(projectsWithTasks);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error("Failed to load projects");
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, { ...newProject, tasks: [] }]);
    setShowProjectForm(false);
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
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {showProjectForm ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Create New Project</h3>
                  <Button variant="outline" onClick={() => setShowProjectForm(false)}>
                    Cancel
                  </Button>
                </div>
                <ProjectForm onProjectCreated={handleProjectCreated} />
              </div>
            ) : (
              <ProjectList projects={projects} />
            )}
          </TabsContent>

          <TabsContent value="completed">
            <p className="text-muted-foreground">No completed projects found.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
