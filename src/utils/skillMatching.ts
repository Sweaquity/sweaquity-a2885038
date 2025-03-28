import { Skill, SkillRequirement, EquityProject, SubTask } from "@/types/jobSeeker";

/**
 * Calculate the percentage of skills that match between a user's skills and a task's requirements
 * with added weight for proficiency levels
 */
export const calculateSkillMatch = (
  userSkills: (Skill | string)[], 
  taskSkills: (SkillRequirement | string)[]
): number => {
  if (!Array.isArray(taskSkills) || taskSkills.length === 0) return 0;
  if (!Array.isArray(userSkills) || userSkills.length === 0) return 0;
  
  // Extract task skill names and required levels to lowercase for comparison
  const taskSkillsData = taskSkills.map(skill => {
    if (typeof skill === 'string') {
      return { skill: String(skill).toLowerCase(), level: 'Intermediate' };
    } else if (skill && typeof skill === 'object' && 'skill' in skill) {
      return { 
        skill: String(skill.skill).toLowerCase(), 
        level: skill.level || 'Intermediate' 
      };
    }
    return null; 
  }).filter(Boolean); // Filter out nulls
  
  // Extract user skill names and proficiency levels to lowercase for comparison
  const userSkillsData = userSkills.map(s => {
    if (typeof s === 'string') {
      return { skill: String(s).toLowerCase(), level: 'Intermediate' };
    } else if (s && typeof s === 'object' && 'skill' in s) {
      return { 
        skill: String(s.skill).toLowerCase(), 
        level: s.level || 'Intermediate' 
      };
    }
    return null;
  }).filter(Boolean); // Remove nulls
  
  // Create a user skills map for faster lookup
  const userSkillsMap = new Map();
  userSkillsData.forEach(userSkill => {
    userSkillsMap.set(userSkill.skill, userSkill.level);
  });
  
  // Weight factors for different skill levels
  const skillLevelWeights = {
    'Beginner': 0.5,
    'Intermediate': 1.0,
    'Expert': 1.5
  };
  
  let totalWeight = 0;
  let matchWeight = 0;
  
  // Calculate weighted match
  taskSkillsData.forEach(taskSkill => {
    // Each task skill starts with a base weight of 1
    const baseWeight = 1;
    totalWeight += baseWeight;
    
    // Check if the user has this skill
    if (userSkillsMap.has(taskSkill.skill)) {
      const userLevel = userSkillsMap.get(taskSkill.skill);
      const taskLevel = taskSkill.level;
      
      // Base match weight
      let skillMatchWeight = baseWeight * 0.6;  // 60% just for having the skill
      
      // Additional weight based on proficiency level match
      const userLevelWeight = skillLevelWeights[userLevel] || 1.0;
      const taskLevelWeight = skillLevelWeights[taskLevel] || 1.0;
      
      // Perfect level match or exceed required level
      if (userLevelWeight >= taskLevelWeight) {
        skillMatchWeight = baseWeight;  // 100% match
      } 
      // Close but not quite there
      else if (userLevelWeight > 0.5) {
        skillMatchWeight = baseWeight * 0.8;  // 80% match
      }
      
      matchWeight += skillMatchWeight;
    }
    // Check for related skills to give partial credit
    else {
      const relatedSkills = getRelatedSkills(taskSkill.skill);
      const userHasRelatedSkill = relatedSkills.some(related => userSkillsMap.has(related));
      
      if (userHasRelatedSkill) {
        matchWeight += baseWeight * 0.3;  // 30% for having a related skill
      }
    }
  });
  
  // Calculate percentage (0-100)
  const matchPercentage = Math.round((matchWeight / totalWeight) * 100);
  
  return Math.min(100, matchPercentage);  // Cap at 100%
};

/**
 * Get related skills for a given skill
 */
export const getRelatedSkills = (skillName: string): string[] => {
  const skillRelationships = {
    // Programming Languages
    'javascript': ['typescript', 'react', 'node.js', 'vue', 'angular'],
    'typescript': ['javascript', 'react', 'node.js', 'angular'],
    'python': ['django', 'flask', 'pandas', 'numpy', 'tensorflow'],
    'java': ['spring', 'hibernate', 'kotlin', 'android'],
    'c#': ['.net', 'asp.net', 'xamarin', 'unity'],
    'php': ['laravel', 'symfony', 'wordpress'],
    
    // Web Technologies
    'react': ['javascript', 'typescript', 'redux', 'next.js', 'gatsby'],
    'angular': ['typescript', 'javascript', 'rxjs'],
    'vue': ['javascript', 'nuxt.js'],
    'node.js': ['javascript', 'express', 'typescript'],
    
    // Databases
    'sql': ['postgresql', 'mysql', 'oracle', 'sql server'],
    'postgresql': ['sql', 'database design'],
    'mongodb': ['nosql', 'mongoose'],
    
    // Cloud & DevOps
    'aws': ['cloud', 'ec2', 's3', 'lambda', 'dynamodb'],
    'docker': ['kubernetes', 'containerization', 'devops'],
    'kubernetes': ['docker', 'orchestration', 'devops'],
    
    // Mobile
    'android': ['java', 'kotlin', 'mobile development'],
    'ios': ['swift', 'objective-c', 'mobile development'],
    'react native': ['react', 'javascript', 'mobile development'],
    'flutter': ['dart', 'mobile development'],
    
    // General
    'agile': ['scrum', 'kanban', 'project management'],
    'ui design': ['ux design', 'figma', 'sketch'],
    'machine learning': ['data science', 'python', 'tensorflow', 'pytorch']
  };
  
  return skillRelationships[skillName.toLowerCase()] || [];
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
    const filterSkillLower = filterSkill.toLowerCase();
    filtered = filtered.filter(project => {
      const requirements = project.sub_tasks?.flatMap(task => task.skill_requirements || []) || [];
      
      // Direct skill match
      const directMatch = requirements.some(req => {
        if (typeof req === 'string') {
          return String(req).toLowerCase() === filterSkillLower;
        }
        if (req && typeof req === 'object' && 'skill' in req && typeof req.skill === 'string') {
          return String(req.skill).toLowerCase() === filterSkillLower;
        }
        return false;
      });
      
      // Related skill match
      if (!directMatch) {
        const relatedSkills = getRelatedSkills(filterSkillLower);
        return requirements.some(req => {
          const reqSkill = typeof req === 'string' ? 
            String(req).toLowerCase() : 
            (req && typeof req === 'object' && 'skill' in req ? String(req.skill).toLowerCase() : '');
          
          return relatedSkills.includes(reqSkill);
        });
      }
      
      return directMatch;
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
  const skillNameLower = String(skillName).toLowerCase();
  
  // Direct match
  if (userSkillStrings.includes(skillNameLower)) {
    return true;
  }
  
  // Check related skills
  const relatedSkills = getRelatedSkills(skillNameLower);
  return relatedSkills.some(related => userSkillStrings.includes(related));
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

/**
 * Generate skill suggestions based on user's existing skills
 */
export const suggestRelatedSkills = (userSkills: Skill[]): Skill[] => {
  const userSkillStrings = convertUserSkillsToStrings(userSkills);
  const suggestions = new Set<string>();
  
  // For each user skill, get related skills
  userSkillStrings.forEach(skill => {
    const relatedSkills = getRelatedSkills(skill);
    relatedSkills.forEach(related => {
      // Only add if user doesn't already have this skill
      if (!userSkillStrings.includes(related)) {
        suggestions.add(related);
      }
    });
  });
  
  // Convert to Skill objects
  return Array.from(suggestions).map(skill => ({
    skill,
    level: 'Beginner'  // Default suggestion level
  }));
};

/**
 * Rank projects based on skill match and other factors
 */
export const rankProjectsByRelevance = (
  projects: EquityProject[],
  userSkills: Skill[]
): EquityProject[] => {
  const userSkillStrings = convertUserSkillsToStrings(userSkills);
  
  // Calculate match score for each project
  const scoredProjects = projects.map(project => {
    // Get all skill requirements from sub-tasks
    const allRequirements = project.sub_tasks?.flatMap(task => task.skill_requirements || []) || [];
    
    // Calculate skill match
    const skillMatchScore = calculateSkillMatch(userSkills, allRequirements);
    
    // Additional factors could be considered here:
    // - Project recency
    // - Equity amount
    // - Project status
    // - Time commitment
    
    return {
      ...project,
      skillMatch: skillMatchScore
    };
  });
  
  // Sort by match score descending
  return scoredProjects.sort((a, b) => (b.skillMatch || 0) - (a.skillMatch || 0));
};

// Update the mockSkills to use the correct skill property
const mockSkills = [
  { skill: "JavaScript", level: "Beginner" },
  { skill: "React", level: "Beginner" },
  { skill: "TypeScript", level: "Beginner" }
];
