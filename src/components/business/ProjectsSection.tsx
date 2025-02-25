
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  tasks: Task[];
}

export const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    equity_allocation: 0
  });
  const [newTask, setNewTask] = useState({
    projectId: "",
    title: "",
    description: ""
  });

  const handleCreateProject = async () => {
    try {
      const { data, error } = await supabase
        .from('business_projects')
        .insert({
          title: newProject.title,
          description: newProject.description,
          equity_allocation: newProject.equity_allocation
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([...projects, { ...data, tasks: [] }]);
      setNewProject({ title: "", description: "", equity_allocation: 0 });
      toast.success("Project created successfully");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleCreateTask = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: newTask.projectId,
          title: newTask.title,
          description: newTask.description
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(projects.map(project => {
        if (project.id === newTask.projectId) {
          return {
            ...project,
            tasks: [...project.tasks, data]
          };
        }
        return project;
      }));
      
      setNewTask({ projectId: "", title: "", description: "" });
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleLogEffort = async (taskId: string, hours: number) => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .update({
          hours_logged: hours
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      toast.success("Effort logged successfully");
    } catch (error) {
      toast.error("Failed to log effort");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Projects & Tasks</h2>
        <Button onClick={() => document.getElementById('new-project-form')?.scrollIntoView()}>
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
            <div className="space-y-6">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">{project.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        Equity Allocation: {project.equity_allocation}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.tasks.map(task => (
                        <div key={task.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{task.hours_logged} hours</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Equity earned: {task.equity_earned}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <p className="text-muted-foreground">No completed projects found.</p>
          </TabsContent>
        </Tabs>

        <div id="new-project-form" className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Create New Project</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                value={newProject.title}
                onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={newProject.description}
                onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="equity-allocation">Equity Allocation (%)</Label>
              <Input
                id="equity-allocation"
                type="number"
                min="0"
                max="100"
                value={newProject.equity_allocation}
                onChange={e => setNewProject(prev => ({ ...prev, equity_allocation: parseFloat(e.target.value) }))}
              />
            </div>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
