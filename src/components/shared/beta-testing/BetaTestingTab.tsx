
import React, { useState, useEffect, useCallback } from "react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { ProjectCard } from "@/components/business/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { fetchProjects } from "@/components/business/projects/services/ProjectService";

// Define a specialized Project type for this component
interface Project {
  project_id: string;
  id?: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: any[];
}

export const BetaTestingTab = ({ includeProjectTickets = true }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectFormValues, setProjectFormValues] = useState({
    title: "",
    description: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectsData = await fetchProjects();
      
      // Ensure all projects have both id and project_id for compatibility
      const projectsWithId = projectsData.map(project => ({
        ...project,
        id: project.id || project.project_id
      }));
      
      setProjects(projectsWithId as Project[]);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    // This would fetch the latest tickets - implementation depends on your API
    console.log("Fetching the latest tickets");
  }, []);

  useEffect(() => {
    const getUserAndProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
        await loadProjects();
      } catch (error) {
        console.error("Error loading user and projects:", error);
      }
    };

    getUserAndProjects();
  }, [loadProjects]);

  const handleCreateProject = async () => {
    const { title, description } = projectFormValues;

    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for the project.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("business_projects")
        .insert({
          title,
          description,
          business_id: user.id,
          status: "active",
          equity_allocation: 5,
          skills_required: ["Testing", "QA", "UI/UX"],
          project_timeframe: "3 months",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure the new project has both id and project_id for compatibility
      const projectWithId = {
        ...data,
        id: data.project_id
      };

      setProjects(prevProjects => [...prevProjects, projectWithId as Project]);
      setIsProjectDialogOpen(false);
      setProjectFormValues({ title: "", description: "" });
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Beta Testing Projects</h2>
        <Button onClick={() => setIsProjectDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-muted rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating a new beta testing project.
          </p>
          <Button onClick={() => setIsProjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      ) : projects.length === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ProjectCard project={projects[0]} onEdit={() => {}} onDelete={() => {}} />
          </div>
          {includeProjectTickets && projects[0].project_id && userId && (
            <TicketDashboard
              projectFilter={projects[0].project_id}
              userFilter={userId}
              onRefresh={fetchTickets}
            />
          )}
        </div>
      ) : projects.length > 0 ? (
        <Tabs defaultValue={projects[0].project_id} className="w-full">
          <TabsList>
            {projects.map((project) => (
              <TabsTrigger key={project.project_id} value={project.project_id}>
                {project.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {projects.map((project) => (
            <TabsContent key={project.project_id} value={project.project_id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ProjectCard 
                    project={project} 
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                  />
                </div>
                {includeProjectTickets && project.project_id && userId && (
                  <TicketDashboard
                    projectFilter={project.project_id}
                    userFilter={userId}
                    onRefresh={fetchTickets}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : null}

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Beta Testing Project</DialogTitle>
            <DialogDescription>
              Add a new project for beta testing and feedback collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={projectFormValues.title}
                onChange={(e) =>
                  setProjectFormValues({
                    ...projectFormValues,
                    title: e.target.value,
                  })
                }
                placeholder="Enter project title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={projectFormValues.description}
                onChange={(e) =>
                  setProjectFormValues({
                    ...projectFormValues,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
