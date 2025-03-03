
import { Skill, SkillRequirement } from "@/types/jobSeeker";

interface MatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  totalSkillsRequired: number;
}

export const skillMatching = (userSkills: Skill[], task: any): MatchResult | null => {
  // Check if the task has required skills
  if (task && task.skill_requirements && Array.isArray(task.skill_requirements)) {
    const taskSkills = task.skill_requirements.map((sk: string | SkillRequirement) => {
      if (typeof sk === 'string') {
        return sk.toLowerCase();
      } else if (sk && typeof sk === 'object' && 'skill' in sk && typeof sk.skill === 'string') {
        return sk.skill.toLowerCase();
      }
      return ''; // Return empty string for invalid skills
    }).filter(skill => skill !== ''); // Filter out empty strings
    
    // Extract user skill names to lowercase for comparison
    const userSkillNames = userSkills.map(s => {
      if (typeof s === 'string') {
        return s.toLowerCase();
      } else if (s && typeof s.skill === 'string') {
        return s.skill.toLowerCase();
      }
      return '';
    }).filter(Boolean); // Remove empty strings
    
    // Find matching skills
    const matchedSkills = taskSkills.filter(skill => 
      userSkillNames.includes(skill)
    );
    
    // Calculate match percentage
    const matchPercentage = taskSkills.length > 0
      ? Math.round((matchedSkills.length / taskSkills.length) * 100)
      : 0;
    
    return {
      matchPercentage,
      matchedSkills,
      totalSkillsRequired: taskSkills.length
    };
  }
  
  return null;
};
