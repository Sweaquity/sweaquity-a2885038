import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface LinkedInImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (skills: string[]) => void;
  parsedSkills?: string[];
}

export const LinkedInImportDialog = ({ 
  open, 
  onClose,
  onImport
}: LinkedInImportDialogProps) => {
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);

  useEffect(() => {
    // Mock parsed skills for demonstration
    const mockSkills = [
      "JavaScript",
      "React",
      "Node.js",
      "HTML",
      "CSS",
      "TypeScript",
      "GraphQL",
      "REST APIs"
    ];
    setParsedSkills(mockSkills);
    setSelectedSkills([...Array(mockSkills.length).keys()]); // Select all by default
  }, [open]);

  const handleImport = () => {
    const skillsToImport = selectedSkills.map(index => parsedSkills[index]);
    onImport(skillsToImport);
    onClose();
  };

  // Add this helper function
  const getSkillText = (skill: any) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') {
      return skill.skill || skill.name || '';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Skills from LinkedIn</DialogTitle>
          <DialogDescription>
            Select the skills you want to import to your profile.
          </DialogDescription>
        </DialogHeader>
          
        {parsedSkills.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {parsedSkills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox 
                    id={`skill-${index}`} 
                    checked={selectedSkills.includes(index)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSkills(prev => [...prev, index]);
                      } else {
                        setSelectedSkills(prev => prev.filter(i => i !== index));
                      }
                    }}
                  />
                  <label 
                    htmlFor={`skill-${index}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {getSkillText(skill)}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedSkills.length === parsedSkills.length) {
                    setSelectedSkills([]);
                  } else {
                    setSelectedSkills([...Array(parsedSkills.length).keys()]);
                  }
                }}
              >
                {selectedSkills.length === parsedSkills.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>
        )}
          
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport}>Import Skills</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
