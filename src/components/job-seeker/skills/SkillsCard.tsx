
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
import { toast } from "sonner";

interface SkillsCardProps {
  skills: string[];
  onSkillsUpdate: (skills: string[]) => void;
}

export const SkillsCard = ({ skills, onSkillsUpdate }: SkillsCardProps) => {
  const [bulkSkills, setBulkSkills] = useState("");

  const handleDeleteSkill = (skillToDelete: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToDelete);
    onSkillsUpdate(updatedSkills);
    toast.success(`Removed skill: ${skillToDelete}`);
  };

  const handleBulkSkillsSubmit = () => {
    if (!bulkSkills.trim()) {
      toast.error("Please enter some skills");
      return;
    }

    const newSkills = bulkSkills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const uniqueSkills = Array.from(new Set([...skills, ...newSkills]));
    onSkillsUpdate(uniqueSkills);
    setBulkSkills("");
    toast.success("Skills updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          Add your skills manually or they will be automatically extracted from your CV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bulk-skills">Add Multiple Skills (comma-separated)</Label>
          <Textarea
            id="bulk-skills"
            placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
            value={bulkSkills}
            onChange={(e) => setBulkSkills(e.target.value)}
            className="mt-2"
          />
          <Button 
            onClick={handleBulkSkillsSubmit}
            className="mt-2"
          >
            Add Skills
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <div 
              key={index} 
              className="group bg-secondary px-3 py-1 rounded-full text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() => handleDeleteSkill(skill)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                aria-label={`Delete ${skill} skill`}
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
