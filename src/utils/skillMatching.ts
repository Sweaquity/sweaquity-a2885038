
import { Skill, SkillRequirement, EquityProject, SubTask } from "@/types/jobSeeker";

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
      return String(skill).toLowerCase();
    } else if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
      return String(skill.skill).toLowerCase();
    }
    return ''; 
  }).filter(skill => skill !== ''); // Filter out empty strings
  
  // Extract user skill names to lowercase for comparison
  const userSkillNames = userSkills.map(s => {
    if (typeof s === 'string') {
      return String(s).toLowerCase();
    } else if (s && typeof s === 'object' && 'skill' in s && typeof s.skill === 'string') {
      return String(s.skill).toLowerCase();
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

/**
 * Filter projects based on search term and selected skill
 */
export const filterProjects = (
  projects: EquityProject[],
  searchTerm: string,
  filterSkill: string | null
): EquityProject[] => {
  let filtered = [...projects];

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(project => {
      // Check against project title
      if (project.title && project.title.toLowerCase().includes(term)) return true;
      
      // Check against business name
      if (project.business_roles?.company_name && 
          String(project.business_roles.company_name).toLowerCase().includes(term)) return true;
      
      // Check against project description
      const projectDescription = project.business_roles?.description;
      if (projectDescription && String(projectDescription).toLowerCase().includes(term)) return true;
      
      // Check against task title
      const taskTitle = project.business_roles?.title;
      if (taskTitle && String(taskTitle).toLowerCase().includes(term)) return true;
      
      return false;
    });
  }

  if (filterSkill) {
    filtered = filtered.filter(project => {
      const requirements = project.sub_tasks?.flatMap(task => task.skill_requirements || []) || [];
      
      return requirements.some(req => {
        if (typeof req === 'string') {
          return String(req).toLowerCase() === filterSkill.toLowerCase();
        }
        if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
          return String(req.skill).toLowerCase() === filterSkill.toLowerCase();
        }
        return false;
      });
    });
  }

  return filtered;
};

/**
 * Extract all unique skills from a list of projects
 */
export const extractUniqueSkills = (projects: EquityProject[]): string[] => {
  const skillsSet = new Set<string>();
  
  projects.forEach(project => {
    project.sub_tasks?.forEach(task => {
      const requirements = task.skill_requirements || [];
      requirements.forEach(req => {
        if (typeof req === 'string') {
          skillsSet.add(String(req).toLowerCase());
        } else if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
          skillsSet.add(String(req.skill).toLowerCase());
        }
      });
    });
  });
  
  return Array.from(skillsSet);
};

/**
 * Check if a skill is in the user's skill list
 */
export const isUserSkill = (
  skillName: string, 
  userSkillStrings: string[]
): boolean => {
  return userSkillStrings.includes(String(skillName).toLowerCase());
};

/**
 * Convert user skills to lowercase strings for comparison
 */
export const convertUserSkillsToStrings = (userSkills: Skill[]): string[] => {
  return userSkills.map(skill => {
    if (typeof skill === 'string') {
      return String(skill).toLowerCase();
    }
    if (skill && typeof skill === 'object' && 'skill' in skill && typeof skill.skill === 'string') {
      return String(skill.skill).toLowerCase();
    }
    return '';
  }).filter(Boolean);
};
