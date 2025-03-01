
import { Badge } from "@/components/ui/badge";

interface SkillRequirement {
  skill: string;
  level: string;
}

interface ApplicationSkillsProps {
  skills?: string[];
  matchedSkills?: string[];
  roleSkills?: string[];
  skillRequirements?: SkillRequirement[];
  totalSkills?: number;
  limit?: number;
  small?: boolean;
  displayEmpty?: boolean;
}

export const ApplicationSkills = ({ 
  skills = [], 
  matchedSkills = [],
  roleSkills = [],
  skillRequirements = [],
  totalSkills = 0,
  limit,
  small = false,
  displayEmpty = false
}: ApplicationSkillsProps) => {
  // Use skillRequirements if provided, otherwise fallback to roleSkills and skills
  const hasSkillRequirements = skillRequirements && skillRequirements.length > 0;
  const displaySkillsArray = hasSkillRequirements ? [] : roleSkills.length > 0 ? roleSkills : skills;
  
  if (!hasSkillRequirements && displaySkillsArray.length === 0 && displayEmpty) {
    return <p className="text-sm text-muted-foreground">No skills specified for this task</p>;
  }
  
  const displaySkills = limit ? displaySkillsArray.slice(0, limit) : displaySkillsArray;
  const displaySkillReqs = limit ? skillRequirements.slice(0, limit) : skillRequirements;
  
  const remainingCount = totalSkills > displaySkills.length ? totalSkills - displaySkills.length : 0;
  
  return (
    <div className={`flex flex-wrap ${small ? 'gap-1' : 'gap-1.5'}`}>
      {hasSkillRequirements ? (
        // Display skill requirements with level
        displaySkillReqs.map((skillReq, index) => {
          const isMatched = matchedSkills.includes(skillReq.skill);
          return (
            <Badge 
              key={index} 
              variant={isMatched ? "default" : "secondary"} 
              className={small ? "text-xs" : ""}
            >
              {skillReq.skill} ({skillReq.level}) {isMatched && "✓"}
            </Badge>
          );
        })
      ) : (
        // Display simple skills
        displaySkills.map((skill, index) => {
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
        })
      )}
      
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};
