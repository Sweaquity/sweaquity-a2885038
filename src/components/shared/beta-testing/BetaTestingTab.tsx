import React, { useState, useEffect, useCallback } from "react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { ProjectCard } from "@/components/business/projects/ProjectCard";
import { fetchProjects } from "@/components/business/projects/services/ProjectService";
import { Project } from "@/types/business";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface BetaTestingTabProps {
  userType: "job_seeker" | "business";
  userId?: string;
  includeProjectTickets?: boolean;
}

interface ProjectFormValues {
  title: string;
  description: string;
}

export const BetaTestingTab: React.FC<BetaTestingTabProps> = ({ userType, userId, includeProjectTickets = true }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectFormValues, setProjectFormValues] = useState<ProjectFormValues>({
    title: "",
    description: ""
  });
  const { toast } = useToast();

  const fetchProjectsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjectsData();
  }, [fetchProjectsData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectFormValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
  };

  const createProject = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const newProject = {
        title: projectFormValues.title,
        description: projectFormValues.description,
        business_id: user.id,
        status: "active",
        equity_allocation: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('business_projects')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        throw error;
      }

      setProjects(prevProjects => [...prevProjects, data]);
      setIsProjectDialogOpen(false);
      setProjectFormValues({ title: "", description: "" });
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    fetchProjectsData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Projects</h2>
        {userType === "business" && (
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Create Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project to start collaborating with job seekers.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    type="text"
                    id="title"
                    name="title"
                    value={projectFormValues.title}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    type="text"
                    id="description"
                    name="description"
                    value={projectFormValues.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={createProject} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <Tabs defaultValue={projects[0].id} className="w-full">
          <TabsList>
            {projects.map((project) => (
              <TabsTrigger key={project.id} value={project.id}>
                {project.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {projects.map((project) => (
            <TabsContent key={project.id} value={project.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ProjectCard project={project} />
                </div>
                {includeProjectTickets && project.id && userId && (
                  <TicketDashboard
                    projectFilter={project.id}
                    userFilter={userId}
                    onRefresh={fetchTickets}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">
            No projects available.
          </p>
        </div>
      )}
    </div>
  );
};
