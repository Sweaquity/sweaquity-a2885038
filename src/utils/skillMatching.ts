
import { Skill, SkillRequirement } from "@/types/jobSeeker";

export const getSkillLevel = (level: string): number => {
  const levels = {
    'Beginner': 1,
    'beginner': 1,
    'Intermediate': 2,
    'intermediate': 2,
    'Expert': 3,
    'expert': 3
  };
  return levels[level as keyof typeof levels] || 0;
};

export const hasRequiredSkillLevel = (userSkill: Skill, requiredSkill: SkillRequirement) => {
  const userLevel = getSkillLevel(userSkill.level);
  const requiredLevel = getSkillLevel(requiredSkill.level);
  return userSkill.name.toLowerCase() === requiredSkill.skill.toLowerCase() && userLevel >= requiredLevel;
};

export const getSkillMatchCount = (taskSkills: SkillRequirement[] | undefined, userSkills: Skill[]) => {
  if (!taskSkills) return 0;
  return taskSkills.filter(requiredSkill => 
    userSkills.some(userSkill => hasRequiredSkillLevel(userSkill, requiredSkill))
  ).length;
};

export const getMatchPercentage = (matchCount: number, totalRequired: number) => {
  if (totalRequired === 0) return 0;
  return Math.round((matchCount / totalRequired) * 100);
};
