
import { Skill, SkillRequirement } from "@/types/jobSeeker";

/**
 * Calculate the percentage of skills that match between a user's skills and a task's requirements
 */
export const calculateSkillMatch = (
  userSkills: (Skill | string)[], 
  taskSkills: (SkillRequirement | string)[]
): number => {
  if (!Array.isArray(taskSkills) || taskSkills.length === 0) return 0;
  if (!Array.isArray(userSkills) || userSkills.length === 0) return 0;
  
  // Extract task skill names to lowercase for comparison
  const taskSkillNames = taskSkills.map(skill => {
    if (typeof skill === 'string') {
      return skill.toLowerCase();
    } else if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
      return skill.skill.toLowerCase();
    }
    return ''; 
  }).filter(skill => skill !== ''); // Filter out empty strings
  
  // Extract user skill names to lowercase for comparison
  const userSkillNames = userSkills.map(s => {
    if (typeof s === 'string') {
      return s.toLowerCase();
    } else if (s && typeof s === 'object' && 'skill' in s && typeof s.skill === 'string') {
      return s.skill.toLowerCase();
    }
    return '';
  }).filter(Boolean); // Remove empty strings
  
  // Find matching skills
  const matchedSkills = taskSkillNames.filter(skill => 
    userSkillNames.includes(skill)
  );
  
  // Calculate percentage
  const matchPercentage = Math.round((matchedSkills.length / taskSkillNames.length) * 100);
  
  return matchPercentage;
};
