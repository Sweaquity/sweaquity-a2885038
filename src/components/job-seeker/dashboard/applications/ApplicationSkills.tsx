
import { Badge } from "@/components/ui/badge";

interface ApplicationSkillsProps {
  skills?: string[];
  matchedSkills?: string[];
  roleSkills?: string[];
  totalSkills?: number;
  limit?: number;
  small?: boolean;
  displayEmpty?: boolean;
}

export const ApplicationSkills = ({ 
  skills = [], 
  matchedSkills = [],
  roleSkills = [],
  totalSkills = 0,
  limit,
  small = false,
  displayEmpty = false
}: ApplicationSkillsProps) => {
  // Use roleSkills if provided, otherwise use skills
  const displaySkillsArray = roleSkills.length > 0 ? roleSkills : skills;
  
  if (displaySkillsArray.length === 0 && displayEmpty) {
    return <p className="text-sm text-muted-foreground">No skills specified for this task</p>;
  }
  
  const displaySkills = limit ? displaySkillsArray.slice(0, limit) : displaySkillsArray;
  const remainingCount = totalSkills > displaySkills.length ? totalSkills - displaySkills.length : 0;
  
  return (
    <div className={`flex flex-wrap ${small ? 'gap-1' : 'gap-1.5'}`}>
      {displaySkills.map((skill, index) => {
        const isMatched = matchedSkills.includes(skill);
        return (
          <Badge 
            key={index} 
            variant={isMatched ? "default" : "secondary"} 
            className={small ? "text-xs" : ""}
          >
            {skill} {isMatched && "✓"}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};
