
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skill } from "@/types/jobSeeker";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { SkillBadge } from "@/components/job-seeker/dashboard/SkillBadge";

interface SkillsCardProps {
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
}

export const SkillsCard = ({ skills, onSkillsUpdate }: SkillsCardProps) => {
  const [newSkill, setNewSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");

  const addSkill = () => {
    if (newSkill.trim() === "") {
      toast.error("Please enter a skill name");
      return;
    }

    // Check if skill already exists
    if (skills.some((s) => {
      const skillName = 'skill' in s ? s.skill : 'name' in s ? s.name : '';
      return skillName.toLowerCase() === newSkill.toLowerCase();
    })) {
      toast.error("This skill already exists in your profile");
      return;
    }

    // Add the new skill
    const updatedSkills = [...skills, { skill: newSkill, level: skillLevel }];
    onSkillsUpdate(updatedSkills as Skill[]);
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter((s) => {
      const skillName = 'skill' in s ? s.skill : 'name' in s ? s.name : '';
      return skillName !== skillToRemove;
    });
    onSkillsUpdate(updatedSkills);
  };

  const updateSkillLevel = (skillName: string, newLevel: "Beginner" | "Intermediate" | "Expert") => {
    const updatedSkills = skills.map((s) => {
      const currentSkillName = 'skill' in s ? s.skill : 'name' in s ? s.name : '';
      return currentSkillName === skillName ? { ...s, level: newLevel } : s;
    });
    onSkillsUpdate(updatedSkills);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const skillName = 'skill' in skill ? skill.skill : 'name' in skill ? skill.name : '';
              return (
                <SkillBadge
                  key={skillName}
                  skill={skill}
                  onRemove={() => removeSkill(skillName)}
                  onLevelChange={(level) => updateSkillLevel(skillName, level)}
                />
              );
            })}
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </div>

          {/* Single form for adding new skills */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 sm:col-span-5">
              <Input
                placeholder="Add a new skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-span-8 sm:col-span-4">
              <Select
                value={skillLevel}
                onValueChange={(value) => setSkillLevel(value as "Beginner" | "Intermediate" | "Expert")}
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
            <div className="col-span-4 sm:col-span-3">
              <Button 
                onClick={addSkill} 
                type="button" 
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
