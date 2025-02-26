
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    equity_allocation: 0,
    skills_required: [] as string[],
    project_timeframe: ""
  });
  const [newTask, setNewTask] = useState({
    projectId: "",
    title: "",
    description: "",
    equity_allocation: 0,
    timeframe: "",
    skills_required: [] as string[]
  });
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (projectOrTask: 'project' | 'task') => {
    if (!skillInput.trim()) return;
    
    if (projectOrTask === 'project') {
      setNewProject(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()]
      }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string, projectOrTask: 'project' | 'task') => {
    if (projectOrTask === 'project') {
      setNewProject(prev => ({
        ...prev,
        skills_required: prev.skills_required.filter(s => s !== skill)
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        skills_required: prev.skills_required.filter(s => s !== skill)
      }));
    }
  };

  const handleCreateProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }

      if (!newProject.title || !newProject.description || !newProject.project_timeframe) {
        toast.error("Please fill in all required fields");
        return;
      }

      const { data, error } = await supabase
        .from('business_projects')
        .insert({
          title: newProject.title,
          description: newProject.description,
          equity_allocation: newProject.equity_allocation,
          skills_required: newProject.skills_required,
          project_timeframe: newProject.project_timeframe,
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjects([...projects, { ...data, tasks: [] }]);
      setNewProject({
        title: "",
        description: "",
        equity_allocation: 0,
        skills_required: [],
        project_timeframe: ""
      });
      toast.success("Project created successfully");
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    }
  };

  const handleCreateTask = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }

      if (!newTask.title || !newTask.description || !newTask.timeframe) {
        toast.error("Please fill in all required fields");
        return;
      }

      const { data, error } = await supabase
        .from('project_sub_tasks')
        .insert({
          project_id: newTask.projectId,
          title: newTask.title,
          description: newTask.description,
          equity_allocation: newTask.equity_allocation,
          timeframe: newTask.timeframe,
          skills_required: newTask.skills_required,
          created_by: session.user.id
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
      
      setNewTask({
        projectId: "",
        title: "",
        description: "",
        equity_allocation: 0,
        timeframe: "",
        skills_required: []
      });
      toast.success("Task created successfully");
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error("Failed to create task");
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
                        Total Equity: {project.equity_allocation}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Required Skills:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.skills_required.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-secondary rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {project.tasks.map(task => (
                        <div key={task.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="mt-2">
                                <p className="text-sm font-medium">Required Skills:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {task.skills_required.map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-secondary rounded-full text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Due: {task.timeframe}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Equity allocated: {task.equity_allocation}%
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
              <Label htmlFor="project-title">Project Title *</Label>
              <Input
                id="project-title"
                required
                value={newProject.title}
                onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description *</Label>
              <Textarea
                id="project-description"
                required
                value={newProject.description}
                onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="project-timeframe">Project Timeframe *</Label>
              <Input
                id="project-timeframe"
                required
                value={newProject.project_timeframe}
                onChange={e => setNewProject(prev => ({ ...prev, project_timeframe: e.target.value }))}
                placeholder="e.g., 3 months, Q4 2024"
              />
            </div>
            <div>
              <Label htmlFor="equity-allocation">Total Equity Allocation (%) *</Label>
              <Input
                id="equity-allocation"
                type="number"
                min="0"
                max="100"
                required
                value={newProject.equity_allocation}
                onChange={e => setNewProject(prev => ({ ...prev, equity_allocation: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Required Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={e => e.key === 'Enter' && handleAddSkill('project')}
                />
                <Button type="button" onClick={() => handleAddSkill('project')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newProject.skills_required.map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-secondary rounded-full text-xs flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill, 'project')}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateProject} className="w-full">Create Project</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
