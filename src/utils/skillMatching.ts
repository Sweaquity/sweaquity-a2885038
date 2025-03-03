import { Skill } from "@/types/jobSeeker";

interface MatchResult {
  matchPercentage: number;
  matchedSkills: number;
  totalSkills: number;
}

export const skillMatching = (userSkills: Skill[], task: any): MatchResult | null => {
  // Check if the task has required skills
  if (task && task.skill_requirements && Array.isArray(task.skill_requirements)) {
    const taskSkills = task.skill_requirements.map(sk => 
      typeof sk === 'string' ? sk.toLowerCase() : sk.skill.toLowerCase()
    );
    
    // Check if the user has skills that match
    if (userSkills && Array.isArray(userSkills)) {
      const userSkillNames = userSkills.map(s => 
        typeof s === 'string' ? s.toLowerCase() : s.skill.toLowerCase()
      );
      
      // Find matching skills
      const matchedSkills = taskSkills.filter(skill => userSkillNames.includes(skill));
      
      // Calculate match percentage
      const matchPercentage = taskSkills.length > 0 
        ? Math.round((matchedSkills.length / taskSkills.length) * 100) 
        : 0;
        
      return {
        matchPercentage,
        matchedSkills: matchedSkills.length,
        totalSkills: taskSkills.length
      };
    }
  }
  
  return null;
};
