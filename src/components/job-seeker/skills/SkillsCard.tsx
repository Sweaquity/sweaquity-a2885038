
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Skill {
  skill: string;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

interface SkillsCardProps {
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
}

export const SkillsCard = ({ skills, onSkillsUpdate }: SkillsCardProps) => {
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');

  const handleDeleteSkill = (skillToDelete: string) => {
    const updatedSkills = skills.filter(skill => skill.skill !== skillToDelete);
    onSkillsUpdate(updatedSkills);
    toast.success(`Removed skill: ${skillToDelete}`);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      toast.error("Please enter a skill");
      return;
    }

    const skillName = newSkill.trim();
    
    if (skills.some(skill => skill.skill.toLowerCase() === skillName.toLowerCase())) {
      toast.error("This skill already exists");
      return;
    }

    const updatedSkills = [...skills, { skill: skillName, level: newSkillLevel }];
    onSkillsUpdate(updatedSkills);
    setNewSkill("");
    toast.success("Skill added successfully");
  };

  const handleSkillLevelChange = (skillName: string, newLevel: 'Beginner' | 'Intermediate' | 'Expert') => {
    const updatedSkills = skills.map(skill => 
      skill.skill === skillName ? { ...skill, level: newLevel } : skill
    );
    onSkillsUpdate(updatedSkills);
    toast.success(`Updated ${skillName} level to ${newLevel}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          Add your skills and expertise level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-skill">Add a new skill</Label>
            <Textarea
              id="new-skill"
              placeholder="Enter a skill (e.g., JavaScript, Project Management)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Skill Level</Label>
            <Select
              value={newSkillLevel}
              onValueChange={(value: 'Beginner' | 'Intermediate' | 'Expert') => setNewSkillLevel(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddSkill}
            className="mt-8"
          >
            Add Skill
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <div 
              key={skill.skill} 
              className="group bg-secondary px-3 py-1 rounded-full text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <span>{skill.skill}</span>
              <Select
                value={skill.level}
                onValueChange={(value: 'Beginner' | 'Intermediate' | 'Expert') => 
                  handleSkillLevelChange(skill.skill, value)
                }
              >
                <SelectTrigger className="h-6 w-24 text-xs border-none bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={() => handleDeleteSkill(skill.skill)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                aria-label={`Delete ${skill.skill} skill`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
