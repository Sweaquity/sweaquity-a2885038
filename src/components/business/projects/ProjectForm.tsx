
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SkillsInput } from "./SkillsInput";

interface Project {
  title: string;
  description: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
}

interface ProjectFormProps {
  initialData?: Project;
  onSubmit?: (data: Project) => void;
  onProjectCreated?: (project: any) => void;
  submitLabel?: string;
}

export const ProjectForm = ({ 
  initialData,
  onSubmit,
  onProjectCreated,
  submitLabel = "Create Project"
}: ProjectFormProps) => {
  const [project, setProject] = useState<Project>({
    title: "",
    description: "",
    equity_allocation: 0,
    skills_required: [],
    project_timeframe: ""
  });

  useEffect(() => {
    if (initialData) {
      setProject(initialData);
    }
  }, [initialData]);

  const handleSubmit = async () => {
    try {
      if (!project.title || !project.description || !project.project_timeframe) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (onSubmit) {
        onSubmit(project);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("No active session found");
        return;
      }

      const { data, error } = await supabase
        .from('business_projects')
        .insert({
          ...project,
          created_by: session.user.id,
          business_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (onProjectCreated) {
        onProjectCreated(data);
      }
      
      setProject({
        title: "",
        description: "",
        equity_allocation: 0,
        skills_required: [],
        project_timeframe: ""
      });
      
      toast.success("Project created successfully");
    } catch (error) {
      console.error('Error with project:', error);
      toast.error("Failed to handle project");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="project-title">Project Title *</Label>
        <Input
          id="project-title"
          required
          value={project.title}
          onChange={e => setProject(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="project-description">Description *</Label>
        <Textarea
          id="project-description"
          required
          value={project.description}
          onChange={e => setProject(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="project-timeframe">Project Timeframe *</Label>
        <Input
          id="project-timeframe"
          required
          value={project.project_timeframe}
          onChange={e => setProject(prev => ({ ...prev, project_timeframe: e.target.value }))}
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
          value={project.equity_allocation}
          onChange={e => setProject(prev => ({ ...prev, equity_allocation: parseFloat(e.target.value) }))}
        />
      </div>
      <SkillsInput
        skills={project.skills_required}
        onChange={skills => setProject(prev => ({ ...prev, skills_required: skills }))}
        helperText="These skills will be broken down into specific requirements in sub-tasks after project creation."
      />
      <Button onClick={handleSubmit} className="w-full">{submitLabel}</Button>
    </div>
  );
};
