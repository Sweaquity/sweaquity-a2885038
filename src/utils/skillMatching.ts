
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";

/**
 * Converts an array of skill objects to lowercase strings for easy comparison
 */
export const convertUserSkillsToStrings = (skills: Skill[] = []): string[] => {
  return skills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
  );
};

/**
 * Extracts all unique skills from an array of projects
 */
export const extractUniqueSkills = (projects: EquityProject[]): string[] => {
  const allSkills = new Set<string>();

  projects.forEach(project => {
    project.sub_tasks?.forEach(task => {
      task.skill_requirements?.forEach(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.skill;
        allSkills.add(skillName);
      });
    });
  });

  return Array.from(allSkills).sort();
};

/**
 * Filters projects based on search term and selected skill
 */
export const filterProjects = (
  projects: EquityProject[],
  searchTerm: string = "",
  filterSkill: string | null = null
): EquityProject[] => {
  const normalizedSearchTerm = searchTerm.toLowerCase();

  return projects.filter(project => {
    // Search term filter
    const matchesSearch = 
      !normalizedSearchTerm || 
      project.title?.toLowerCase().includes(normalizedSearchTerm) ||
      project.sub_tasks?.some(task => 
        task.title.toLowerCase().includes(normalizedSearchTerm) ||
        task.description?.toLowerCase().includes(normalizedSearchTerm)
      );

    // Skill filter
    const matchesSkill = !filterSkill || project.sub_tasks?.some(task => 
      task.skill_requirements?.some(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.skill;
        return skillName === filterSkill;
      })
    );

    return matchesSearch && matchesSkill;
  });
};

/**
 * Calculates skill match percentage between user skills and task requirements
 */
export const calculateSkillMatch = (
  userSkills: string[] = [],
  taskSkillRequirements: Array<string | { skill: string }> = []
): number => {
  if (!taskSkillRequirements.length) return 100; // If no skills required, consider it a perfect match

  const taskSkills = taskSkillRequirements.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase()
  );

  const matchingSkills = taskSkills.filter(skill => 
    userSkills.includes(skill)
  );

  return Math.round((matchingSkills.length / taskSkills.length) * 100);
};
