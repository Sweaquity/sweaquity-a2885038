
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  helperText?: string;
}

export const SkillsInput = ({ skills, onChange, helperText }: SkillsInputProps) => {
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    onChange([...skills, skillInput.trim()]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    onChange(skills.filter(s => s !== skill));
  };

  return (
    <div>
      <Label>Required Skills</Label>
      {helperText && (
        <p className="text-xs text-muted-foreground mb-2">{helperText}</p>
      )}
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
        {skills.map(skill => (
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
  );
};
