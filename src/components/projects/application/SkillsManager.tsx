
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skill } from "@/types/jobSeeker";

interface SubTask {
  id: string;
  skills_required: string[];
  matchScore?: number;
  matchedSkills?: string[];
}

interface SkillsManagerProps {
  userSkills: Skill[];
  setUserSkills: (skills: Skill[]) => void;
  selectedTask: SubTask | null;
  updateTasksWithNewSkills: (updatedSkills: Skill[]) => void;
}

export const SkillsManager = ({ 
  userSkills, 
  setUserSkills, 
  selectedTask,
  updateTasksWithNewSkills
}: SkillsManagerProps) => {
  const [newSkill, setNewSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");

  const addSkill = async () => {
    if (newSkill.trim() === "") {
      toast.error("Please enter a skill name");
      return;
    }

    if (userSkills.some((s) => s.skill.toLowerCase() === newSkill.toLowerCase())) {
      toast.error("This skill already exists in your profile");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newSkillObject = { skill: newSkill, level: skillLevel };
      const updatedSkills = [...userSkills, newSkillObject];

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ skills: updatedSkills })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      const { error: cvDataError } = await supabase
        .from('cv_parsed_data')
        .update({ skills: updatedSkills })
        .eq('user_id', session.user.id);

      if (cvDataError && cvDataError.code !== 'PGRST116') {
        throw cvDataError;
      }

      setUserSkills(updatedSkills);
      setNewSkill("");
      
      // Update tasks with new skills
      updateTasksWithNewSkills(updatedSkills);
      
      toast.success("Skill added successfully");
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error("Failed to add skill");
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium mb-2">Your Skills</h4>
      <div className="flex flex-wrap gap-2 mb-4">
        {userSkills.map((skill, index) => {
          const isMatch = selectedTask?.skills_required.some(
            s => s.toLowerCase() === skill.skill.toLowerCase()
          );
          return (
            <Badge key={index} variant={isMatch ? "default" : "secondary"}>
              {skill.skill} ({skill.level}) {isMatch && "✓"}
            </Badge>
          );
        })}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 md:col-span-1">
          <Input
            placeholder="Add a new skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Select
            value={skillLevel}
            onValueChange={(value: "Beginner" | "Intermediate" | "Expert") => setSkillLevel(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 md:col-span-1">
          <Button 
            onClick={addSkill} 
            type="button" 
            className="w-full"
            variant="outline"
          >
            Add Skill
          </Button>
        </div>
      </div>
    </div>
  );
};
