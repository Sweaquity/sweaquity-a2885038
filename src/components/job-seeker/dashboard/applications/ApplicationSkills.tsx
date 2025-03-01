
import { Badge } from "@/components/ui/badge";
import { SkillRequirement } from "@/types/jobSeeker";

interface ApplicationSkillsProps {
  requiredSkills: Array<SkillRequirement | string>;
  matchedSkills?: string[];
}

export const ApplicationSkills = ({
  requiredSkills,
  matchedSkills = [],
}: ApplicationSkillsProps) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return <p className="text-gray-500 text-sm">No skills required for this role.</p>;
  }

  // Transform skills to a consistent format
  const normalizedSkills = requiredSkills.map(skill => {
    if (typeof skill === 'string') {
      return { 
        skill, 
        level: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Expert'
      };
    }
    return skill as SkillRequirement;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {normalizedSkills.map((skillReq, index) => {
        const isMatched = matchedSkills.some(
          match => match.toLowerCase() === skillReq.skill.toLowerCase()
        );
        
        return (
          <Badge
            key={index}
            variant={isMatched ? "default" : "outline"}
            className={
              isMatched
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "text-gray-600 hover:bg-gray-100"
            }
          >
            {skillReq.skill} {skillReq.level && `(${skillReq.level})`}
          </Badge>
        );
      })}
    </div>
  );
};
