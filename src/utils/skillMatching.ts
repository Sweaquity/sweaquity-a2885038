
import { Skill } from "@/types/jobSeeker";

/**
 * Calculates the skill match percentage between user skills and project requirements
 */
export const calculateSkillMatch = (
  userSkills: (Skill | string)[],
  projectSkills: (Skill | string)[] | undefined
): number => {
  if (!projectSkills || projectSkills.length === 0) return 0;
  if (!userSkills || userSkills.length === 0) return 0;

  const formattedUserSkills = userSkills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    return skill.skill.toLowerCase();
  });

  const formattedProjectSkills = projectSkills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    return typeof skill.skill === 'string' ? skill.skill.toLowerCase() : '';
  }).filter(Boolean);

  if (formattedProjectSkills.length === 0) return 0;

  const matchingSkills = formattedUserSkills.filter(skill => 
    formattedProjectSkills.includes(skill)
  );

  return Math.round((matchingSkills.length / formattedProjectSkills.length) * 100);
};

/**
 * Converts skills array to lowercase strings for easy comparison
 */
export const convertSkillsToStrings = (skills: (Skill | string)[]): string[] => {
  return skills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    return skill.skill.toLowerCase();
  }).filter(Boolean);
};
