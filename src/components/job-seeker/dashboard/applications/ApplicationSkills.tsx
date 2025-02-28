
import { Badge } from "@/components/ui/badge";

interface ApplicationSkillsProps {
  skills: string[];
  matchedSkills: string[];
  totalSkills?: number;
  limit?: number;
  small?: boolean;
  displayEmpty?: boolean;
}

export const ApplicationSkills = ({ 
  skills, 
  matchedSkills, 
  totalSkills = 0,
  limit,
  small = false,
  displayEmpty = false
}: ApplicationSkillsProps) => {
  if (skills.length === 0 && displayEmpty) {
    return <p className="text-sm text-muted-foreground">No skills specified for this task</p>;
  }
  
  const displaySkills = limit ? skills.slice(0, limit) : skills;
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
