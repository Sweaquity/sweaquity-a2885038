
import { Badge } from "@/components/ui/badge";
import { Skill, SkillRequirement } from "@/types/jobSeeker";
import { hasRequiredSkillLevel } from "@/utils/skillMatching";

interface SkillBadgeProps {
  skillReq: SkillRequirement;
  userSkills: Skill[];
}

export const SkillBadge = ({ skillReq, userSkills }: SkillBadgeProps) => {
  const userHasSkill = userSkills.some(
    userSkill => hasRequiredSkillLevel(userSkill, skillReq)
  );

  return (
    <Badge 
      variant="outline"
      className={
        userHasSkill
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-800 border-gray-200'
      }
    >
      {skillReq.skill} ({skillReq.level})
    </Badge>
  );
};
