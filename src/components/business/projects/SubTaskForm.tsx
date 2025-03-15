
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface Task {
  task_id: string;  // Changed from id to task_id to match the database schema
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skill_requirements: SkillRequirement[];
  dependencies: string[];
}

interface SubTaskFormProps {
  projectId: string;
  availableSkills: string[];
  totalEquity: number;
  currentTotalTaskEquity: number;
  onTaskCreated: (task: any) => void;
  onCancel: () => void;
  initialData?: Task;
}

export const SubTaskForm = ({ 
  projectId, 
  availableSkills, 
  totalEquity,
  currentTotalTaskEquity,
  onTaskCreated, 
  onCancel,
  initialData 
}: SubTaskFormProps) => {
  const [task, setTask] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    timeframe: initialData?.timeframe || "",
    equity_allocation: initialData?.equity_allocation || 0,
    skill_requirements: initialData?.skill_requirements || [],
    dependencies: initialData?.dependencies || []
  });

  const [selectedSkill, setSelectedSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");

  const handleAddSkill = () => {
    if (!selectedSkill) return;
    
    setTask(prev => ({
      ...prev,
      skill_requirements: [
        ...prev.skill_requirements,
        { skill: selectedSkill, level: skillLevel }
      ]
    }));
    
    setSelectedSkill("");
    setSkillLevel("beginner");
  };

  const handleSubmit = async () => {
    try {
      if (!task.title || !task.timeframe || task.equity_allocation <= 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (task.skill_requirements.length === 0) {
        toast.error("At least one required skill must be specified");
        return;
      }

      const availableEquity = initialData 
        ? totalEquity - currentTotalTaskEquity + initialData.equity_allocation
        : totalEquity - currentTotalTaskEquity;

      if (task.equity_allocation > availableEquity) {
        toast.error(`Equity allocation cannot exceed remaining equity (${availableEquity}%)`);
        return;
      }

      if (initialData) {
        // For updating, use task_id instead of id
        console.log("Updating task with task_id:", initialData.task_id);
        
        const { data, error } = await supabase
          .from('project_sub_tasks')
          .update({
            ...task,
            project_id: projectId
          })
          .eq('task_id', initialData.task_id)  // Changed from id to task_id          .select()
          .select()
          .single();

        if (error) {
          console.error('Error updating task:', error);
          throw error;
        }
        onTaskCreated(data);
      } else {
        const { data, error } = await supabase
          .from('project_sub_tasks')
          .insert({
            ...task,
            project_id: projectId
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating task:', error);
          throw error;
        }
        onTaskCreated(data);
      }

      toast.success(`Task ${initialData ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error with task:', error);
      toast.error(`Failed to ${initialData ? 'update' : 'create'} task`);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setTask(prev => ({
      ...prev,
      skill_requirements: prev.skill_requirements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="task-title">Task Title *</Label>
        <Input
          id="task-title"
          required
          value={task.title}
          onChange={e => setTask(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={task.description}
          onChange={e => setTask(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="task-timeframe">Timeframe *</Label>
        <Input
          id="task-timeframe"
          required
          value={task.timeframe}
          onChange={e => setTask(prev => ({ ...prev, timeframe: e.target.value }))}
          placeholder="e.g., 2 weeks, 1 month"
        />
      </div>

      <div>
        <Label htmlFor="equity-allocation">Equity Allocation (%) *</Label>
        <div className="space-y-1">
          <Input
            id="equity-allocation"
            type="number"
            min="0"
            max={totalEquity - currentTotalTaskEquity}
            required
            value={task.equity_allocation}
            onChange={e => setTask(prev => ({ ...prev, equity_allocation: parseFloat(e.target.value) }))}
          />
          <p className="text-xs text-muted-foreground">
            Remaining available equity: {totalEquity - currentTotalTaskEquity}%
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Required Skills *</Label>
        <div className="flex gap-2">
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select skill" />
            </SelectTrigger>
            <SelectContent>
              {availableSkills.map(skill => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={skillLevel} onValueChange={setSkillLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          <Button type="button" onClick={handleAddSkill}>Add Skill</Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {task.skill_requirements.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-secondary rounded-full text-xs flex items-center gap-1"
            >
              {skill.skill} - {skill.level}
              <button
                onClick={() => handleRemoveSkill(index)}
                className="hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </div>
  );
};
