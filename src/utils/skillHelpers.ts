
import { Skill, SkillRequirement } from "@/types/jobSeeker";

/**
 * Get the skill name from either a string or skill object
 */
export const getSkillName = (skill: Skill | SkillRequirement): string => {
  if (typeof skill === 'string') return skill;
  return skill.skill;
};

/**
 * Get the skill level from a skill object, defaulting to Intermediate for strings
 */
export const getSkillLevel = (skill: Skill | SkillRequirement): string => {
  if (typeof skill === 'string') return 'Intermediate';
  return skill.level || 'Intermediate';
};

/**
 * Convert skills array to strings array
 */
export const skillsToStrings = (skills: Skill[] | SkillRequirement[]): string[] => {
  if (!skills) return [];
  return skills.map(skill => typeof skill === 'string' ? skill : skill.skill);
};

/**
 * Safely convert a skill to a skill object
 */
export const toSkillObject = (skill: Skill): { skill: string; level: string } => {
  if (typeof skill === 'string') {
    return { skill, level: 'Intermediate' };
  }
  return { ...skill, level: skill.level || 'Intermediate' };
};

/**
 * Check if two skills are the same, ignoring case
 */
export const areSkillsEqual = (skill1: Skill, skill2: Skill): boolean => {
  const name1 = typeof skill1 === 'string' ? skill1.toLowerCase() : skill1.skill.toLowerCase();
  const name2 = typeof skill2 === 'string' ? skill2.toLowerCase() : skill2.skill.toLowerCase();
  return name1 === name2;
};

/**
 * Filter out duplicate skills from an array
 */
export const uniqueSkills = (skills: Skill[]): Skill[] => {
  const result: Skill[] = [];
  skills.forEach(skill => {
    if (!result.some(s => areSkillsEqual(s, skill))) {
      result.push(skill);
    }
  });
  return result;
};
