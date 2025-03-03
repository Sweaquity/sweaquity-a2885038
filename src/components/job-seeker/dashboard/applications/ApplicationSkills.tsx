
import { Badge } from "@/components/ui/badge";
import { SkillRequirement } from "@/types/jobSeeker";

interface ApplicationSkillsProps {
  requiredSkills: (string | SkillRequirement)[];
  matchedSkills: (string | { skill: string; level: string })[];
}

export const ApplicationSkills = ({
  requiredSkills,
  matchedSkills
}: ApplicationSkillsProps) => {
  const getSkillName = (skill: string | SkillRequirement | { skill: string; level: string }): string => {
    if (typeof skill === 'string') {
      return skill;
    }
    return 'skill' in skill ? skill.skill : '';
  };

  const getSkillLevel = (skill: string | SkillRequirement | { skill: string; level: string }): string | undefined => {
    if (typeof skill === 'object' && skill !== null && 'level' in skill) {
      return skill.level;
    }
    return undefined;
  };

  const isSkillMatched = (skill: string | SkillRequirement): boolean => {
    const skillName = getSkillName(skill);
    return matchedSkills.some(
      matchedSkill => getSkillName(matchedSkill).toLowerCase() === skillName.toLowerCase()
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {requiredSkills.map((skill, index) => {
        const skillName = getSkillName(skill);
        const skillLevel = getSkillLevel(skill);
        const matched = isSkillMatched(skill);

        return (
          <Badge 
            key={`${skillName}-${index}`} 
            variant={matched ? "default" : "outline"}
            className={matched ? "" : "text-muted-foreground"}
          >
            {skillName}
            {skillLevel && <span className="ml-1 opacity-70">({skillLevel})</span>}
            {matched && " ✓"}
          </Badge>
        );
      })}
      
      {(!requiredSkills || requiredSkills.length === 0) && (
        <span className="text-sm text-muted-foreground">No specific skills required</span>
      )}
    </div>
  );
};
