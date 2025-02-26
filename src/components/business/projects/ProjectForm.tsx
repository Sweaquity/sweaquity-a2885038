
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ProjectFormProps {
  onProjectCreated: (project: any) => void;
}

export const ProjectForm = ({ onProjectCreated }: ProjectFormProps) => {
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    equity_allocation: 0,
    skills_required: [] as string[],
    project_timeframe: ""
  });
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    setNewProject(prev => ({
      ...prev,
      skills_required: [...prev.skills_required, skillInput.trim()]
    }));
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setNewProject(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(s => s !== skill)
    }));
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
          created_by: session.user.id,
          business_id: session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      onProjectCreated(data);
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

  return (
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
        <p className="text-xs text-muted-foreground mb-2">
          These skills will be broken down into specific requirements in sub-tasks after project creation.
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            placeholder="Add a skill"
            onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
          />
          <Button type="button" onClick={handleAddSkill}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {newProject.skills_required.map(skill => (
            <span
              key={skill}
              className="px-2 py-1 bg-secondary rounded-full text-xs flex items-center gap-1"
            >
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
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
  );
};
