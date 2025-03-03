
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/types/jobSeeker";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Check, X } from "lucide-react";

interface SkillBadgeProps {
  skill: Skill;
  isUserSkill?: boolean;
  onRemove?: () => void;
  onLevelChange?: (level: "Beginner" | "Intermediate" | "Expert") => void;
}

export const SkillBadge = ({
  skill,
  isUserSkill = true,
  onRemove,
  onLevelChange,
}: SkillBadgeProps) => {
  // Safely handle skill strings or objects
  let skillName = "";
  let skillLevel = "Intermediate";
  
  if (typeof skill === 'string') {
    skillName = skill;
  } else if (skill && typeof skill === 'object') {
    if ('skill' in skill && skill.skill !== undefined) {
      skillName = String(skill.skill);
    }
    
    if ('level' in skill && skill.level !== undefined) {
      skillLevel = String(skill.level);
    }
  }

  // Get variant based on whether it's a user's skill or not
  const variant = isUserSkill ? "default" : "outline";

  return (
    <Badge
      variant={variant}
      className={`px-2 py-1 ${
        onRemove || onLevelChange ? "pr-1" : ""
      } ${isUserSkill ? "" : "border-dashed"}`}
    >
      <span className="mr-1">{skillName}</span>
      {skillLevel && <span className="text-xs opacity-70">({skillLevel})</span>}
      
      {(onRemove || onLevelChange) && (
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground">
            <span className="sr-only">Actions</span>
            <X className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onLevelChange && (
              <>
                <DropdownMenuItem onClick={() => onLevelChange("Beginner")}>
                  {skillLevel === "Beginner" && <Check className="mr-2 h-4 w-4" />}
                  Beginner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLevelChange("Intermediate")}>
                  {skillLevel === "Intermediate" && <Check className="mr-2 h-4 w-4" />}
                  Intermediate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLevelChange("Expert")}>
                  {skillLevel === "Expert" && <Check className="mr-2 h-4 w-4" />}
                  Expert
                </DropdownMenuItem>
              </>
            )}
            {onRemove && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onRemove}
              >
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Badge>
  );
};
