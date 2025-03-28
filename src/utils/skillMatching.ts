
import { EquityProject, Skill } from "@/types/jobSeeker";

/**
 * Converts an array of Skill objects to an array of lowercase strings
 */
export const convertUserSkillsToStrings = (skills: Skill[]): string[] => {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(skill => skill.name.toLowerCase());
};

/**
 * Extracts unique skills from all projects for filtering
 */
export const extractUniqueSkills = (projects: EquityProject[]): string[] => {
  if (!projects || !Array.isArray(projects)) return [];
  
  const allSkills = new Set<string>();
  
  projects.forEach(project => {
    if (!project.skills_required) return;
    
    (project.skills_required || []).forEach((skill: any) => {
      if (typeof skill === 'string') {
        allSkills.add(skill);
      } else if (typeof skill === 'object' && skill.skill) {
        allSkills.add(skill.skill);
      }
    });
  });
  
  return Array.from(allSkills).sort();
};

/**
 * Filters projects based on search term and selected skill
 */
export const filterProjects = (
  projects: EquityProject[],
  searchTerm: string,
  filterSkill: string | null
): EquityProject[] => {
  if (!projects || !Array.isArray(projects)) return [];
  
  return projects.filter(project => {
    // Filter by search term
    const searchMatches = !searchTerm || 
      (project.title && project.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by selected skill
    const skillMatches = !filterSkill || (project.skills_required && Array.isArray(project.skills_required) && 
      project.skills_required.some((skill: any) => {
        if (typeof skill === 'string') {
          return skill.toLowerCase() === filterSkill.toLowerCase();
        } else if (typeof skill === 'object' && skill.skill) {
          return skill.skill.toLowerCase() === filterSkill.toLowerCase();
        }
        return false;
      }));
    
    return searchMatches && skillMatches;
  });
};
