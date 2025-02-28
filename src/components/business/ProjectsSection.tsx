
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectList } from "./projects/ProjectList";
import { ProjectForm } from "./projects/ProjectForm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', session.user.id);

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

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ));
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(projectId)) {
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return newExpanded;
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
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <p className="text-muted-foreground">No active projects found.</p>
                ) : (
                  projects.map((project) => (
                    <Collapsible 
                      key={project.id} 
                      open={expandedProjects.has(project.id)}
                      onOpenChange={() => toggleProjectExpanded(project.id)}
                      className="border rounded-lg overflow-hidden"
                    >
                      <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left hover:bg-muted/50">
                        <div>
                          <h3 className="text-lg font-medium">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                        </div>
                        {expandedProjects.has(project.id) ? 
                          <ChevronDown className="h-5 w-5 flex-shrink-0" /> : 
                          <ChevronRight className="h-5 w-5 flex-shrink-0" />
                        }
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <ProjectList 
                          projects={[project]}
                          onProjectUpdated={handleProjectUpdated}
                          onProjectDeleted={handleProjectDeleted}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>
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
