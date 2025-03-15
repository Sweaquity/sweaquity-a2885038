
import { EquityProject, SubTask, Skill } from "@/types/jobSeeker";

// Helper function to convert skill objects to lowercase strings
export const convertUserSkillsToStrings = (skills: Skill[] = []): string[] => {
  return skills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    return skill.skill.toLowerCase();
  });
};

// Helper function to extract unique skills from all projects
export const extractUniqueSkills = (projects: EquityProject[] = []): string[] => {
  const allSkills = new Set<string>();
  
  projects.forEach(project => {
    if (project.sub_tasks) {
      project.sub_tasks.forEach(task => {
        if (task.skill_requirements) {
          // Handle both string[] and SkillRequirement[]
          const taskSkills = task.skill_requirements.map(req => {
            if (typeof req === 'string') return req;
            return req.skill;
          });
          
          taskSkills.forEach(skill => allSkills.add(skill));
        }
      });
    }
    
    // Also check business_roles if present
    if (project.business_roles && project.business_roles.skill_requirements) {
      const businessRolesSkills = project.business_roles.skill_requirements.map(req => {
        if (typeof req === 'string') return req;
        return req.skill;
      });
      
      businessRolesSkills.forEach(skill => allSkills.add(skill));
    }
  });
  
  return Array.from(allSkills);
};

// Filter projects based on search term and selected skill
export const filterProjects = (
  projects: EquityProject[] = [],
  searchTerm: string = '',
  filterSkill: string | null = null
): EquityProject[] => {
  return projects.filter(project => {
    // Filter by search term in title or description
    const titleMatches = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected skill
    let skillMatches = true;
    if (filterSkill) {
      skillMatches = false;
      
      // Check sub-tasks for skill match
      if (project.sub_tasks) {
        skillMatches = project.sub_tasks.some(task => {
          if (!task.skill_requirements) return false;
          
          return task.skill_requirements.some(req => {
            const skillName = typeof req === 'string' ? req : req.skill;
            return skillName.toLowerCase() === filterSkill.toLowerCase();
          });
        });
      }
      
      // Also check business_roles if present
      if (!skillMatches && project.business_roles && project.business_roles.skill_requirements) {
        skillMatches = project.business_roles.skill_requirements.some(req => {
          const skillName = typeof req === 'string' ? req : req.skill;
          return skillName.toLowerCase() === filterSkill.toLowerCase();
        });
      }
    }
    
    return titleMatches && skillMatches;
  });
};

// Calculate skill match percentage for a project
export const calculateProjectSkillMatch = (
  project: EquityProject,
  userSkills: string[]
): EquityProject => {
  const updatedProject = { ...project };
  let matchScore = 0;
  let totalSkills = 0;
  
  if (project.sub_tasks && project.sub_tasks.length > 0) {
    // Loop through sub-tasks and calculate match for each
    updatedProject.sub_tasks = project.sub_tasks.map(task => {
      if (!task.skill_requirements || task.skill_requirements.length === 0) {
        return task;
      }
      
      const skillRequirements = task.skill_requirements.map(req => {
        if (typeof req === 'string') return req;
        return req.skill;
      });
      
      totalSkills += skillRequirements.length;
      
      // Count matched skills
      const matchedSkills = skillRequirements.filter(skill => 
        userSkills.includes(skill.toLowerCase())
      );
      
      const taskMatchScore = skillRequirements.length > 0 
        ? (matchedSkills.length / skillRequirements.length) * 100 
        : 0;
      
      matchScore += matchedSkills.length;
      
      return {
        ...task,
        matchScore: taskMatchScore,
        matchedSkills: matchedSkills
      };
    });
  }
  
  // Calculate overall project match score
  updatedProject.skill_match = totalSkills > 0 
    ? (matchScore / totalSkills) * 100 
    : 0;
  
  return updatedProject;
};

// Process all projects to add skill match data
export const processProjectsWithSkillMatch = (
  projects: EquityProject[],
  userSkills: string[]
): EquityProject[] => {
  return projects.map(project => calculateProjectSkillMatch(project, userSkills));
};

// Get skills for a specific project
export const getProjectSkills = (project: EquityProject): string[] => {
  const skills = new Set<string>();
  
  if (project.sub_tasks) {
    project.sub_tasks.forEach(task => {
      if (task.skill_requirements) {
        task.skill_requirements.forEach(req => {
          const skillName = typeof req === 'string' ? req : req.skill;
          skills.add(skillName);
        });
      }
    });
  }
  
  return Array.from(skills);
};
