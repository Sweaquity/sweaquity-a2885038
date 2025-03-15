
import { JobApplication, Project, BusinessRole, EquityProject, SubTask } from '@/types/business';
import { Skill } from '@/types/jobSeeker';

/**
 * Calculate a skill match score between user skills and required skills
 */
export const calculateSkillMatch = (
  userSkills: Skill[],
  requiredSkills: string[]
): number => {
  if (!userSkills || !requiredSkills || requiredSkills.length === 0) {
    return 0;
  }

  // Clean and normalize skills for comparison
  const normalizedUserSkills = userSkills.map(skill => {
    if (typeof skill === 'string') {
      return skill.toLowerCase();
    } else if (skill && typeof skill === 'object' && skill.skill) {
      return skill.skill.toLowerCase();
    }
    return '';
  }).filter(Boolean);

  const normalizedRequiredSkills = requiredSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : ''
  ).filter(Boolean);

  // Count matches
  const matches = normalizedUserSkills.filter(skill => 
    normalizedRequiredSkills.includes(skill)
  ).length;

  // Calculate score as percentage of required skills matched
  return (matches / normalizedRequiredSkills.length) * 100;
};

/**
 * Map a numeric match score to a qualitative level
 */
export const getMatchLevel = (score: number): 'high' | 'medium' | 'low' | 'none' => {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score > 0) return 'low';
  return 'none';
};

/**
 * Get the color class for a match level
 */
export const getMatchColor = (level: 'high' | 'medium' | 'low' | 'none'): string => {
  const colors = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-orange-500',
    none: 'text-gray-400'
  };
  return colors[level] || colors.none;
};

/**
 * Get the background color class for a match level
 */
export const getMatchBgColor = (level: 'high' | 'medium' | 'low' | 'none'): string => {
  const colors = {
    high: 'bg-green-100',
    medium: 'bg-yellow-100',
    low: 'bg-orange-100',
    none: 'bg-gray-100'
  };
  return colors[level] || colors.none;
};

/**
 * Format a match score for display
 */
export const formatMatchScore = (score: number): string => {
  return `${Math.round(score)}%`;
};

/**
 * Enhanced version of calculateSkillMatch that also returns matched skills
 */
export const analyzeSkillMatch = (
  userSkills: Skill[],
  requiredSkills: string[]
): { 
  score: number; 
  matchLevel: 'high' | 'medium' | 'low' | 'none';
  matchedSkills: string[];
  missingSkills: string[];
} => {
  if (!userSkills || !requiredSkills || requiredSkills.length === 0) {
    return { 
      score: 0, 
      matchLevel: 'none', 
      matchedSkills: [],
      missingSkills: requiredSkills || []
    };
  }

  // Clean and normalize skills for comparison
  const normalizedUserSkills = userSkills.map(skill => {
    if (typeof skill === 'string') {
      return skill.toLowerCase();
    } else if (skill && typeof skill === 'object' && skill.skill) {
      return skill.skill.toLowerCase();
    }
    return '';
  }).filter(Boolean);

  const normalizedRequiredSkills = requiredSkills.map(skill => 
    typeof skill === 'string' ? skill.toLowerCase() : ''
  ).filter(Boolean);

  // Identify matched and missing skills
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  normalizedRequiredSkills.forEach(requiredSkill => {
    if (normalizedUserSkills.includes(requiredSkill)) {
      matchedSkills.push(requiredSkill);
    } else {
      missingSkills.push(requiredSkill);
    }
  });

  // Calculate score
  const score = normalizedRequiredSkills.length > 0 
    ? (matchedSkills.length / normalizedRequiredSkills.length) * 100 
    : 0;

  return {
    score,
    matchLevel: getMatchLevel(score),
    matchedSkills,
    missingSkills
  };
};

/**
 * Match a job seeker's skills against equity projects
 */
export const matchJobSeekerToProjects = (
  projects: EquityProject[],
  userSkills: Skill[]
): EquityProject[] => {
  if (!projects || !userSkills) return [];

  return projects.map(project => {
    // Check for project-level skill requirements
    let requiredSkills = project.skills_required || [];
    
    // Add role-specific requirements if available
    if (project.business_roles && project.business_roles.length > 0) {
      project.business_roles.forEach(role => {
        if (role.required_skills && role.required_skills.length > 0) {
          requiredSkills = [...requiredSkills, ...role.required_skills];
        }
      });
      
      // Remove duplicates
      requiredSkills = [...new Set(requiredSkills)];
    }

    // Calculate match at project level
    const projectMatch = analyzeSkillMatch(userSkills, requiredSkills);
    
    // Process sub-tasks if available
    const subTasks = project.tasks ? project.tasks.map(task => {
      // Calculate match at task level based on skill_requirements
      const taskRequirements = task.skill_requirements || [];
      const taskMatch = analyzeSkillMatch(userSkills, taskRequirements);
      
      return {
        ...task,
        skill_match: taskMatch.score,
        match_level: taskMatch.matchLevel,
        matched_skills: taskMatch.matchedSkills,
        missing_skills: taskMatch.missingSkills
      };
    }) : [];

    // Return enhanced project with match data
    return {
      ...project,
      skill_match: projectMatch.score,
      match_level: projectMatch.matchLevel,
      matched_skills: projectMatch.matchedSkills,
      missing_skills: projectMatch.missingSkills,
      tasks: subTasks
    };
  });
};

/**
 * Find tasks within a project that match a job seeker's skills
 */
export const findMatchingTasks = (
  project: EquityProject,
  userSkills: Skill[],
  threshold: number = 0
): SubTask[] => {
  if (!project || !project.tasks || !userSkills) return [];

  return project.tasks.filter(task => {
    const taskRequirements = task.skill_requirements || [];
    if (taskRequirements.length === 0) return true;
    
    const match = calculateSkillMatch(userSkills, taskRequirements);
    return match >= threshold;
  });
};

/**
 * Check if a specific skill is matched by a user
 */
export const userHasSkill = (
  userSkills: Skill[],
  skillToCheck: string
): boolean => {
  if (!userSkills || !skillToCheck) return false;

  const normalizedSkillToCheck = skillToCheck.toLowerCase();
  
  return userSkills.some(skill => {
    if (typeof skill === 'string') {
      return skill.toLowerCase() === normalizedSkillToCheck;
    } else if (skill && typeof skill === 'object' && skill.skill) {
      return skill.skill.toLowerCase() === normalizedSkillToCheck;
    }
    return false;
  });
};

/**
 * Filter projects based on a skill match threshold
 */
export const filterProjectsBySkillMatch = (
  projects: EquityProject[],
  userSkills: Skill[],
  threshold: number = 50
): EquityProject[] => {
  const matchedProjects = matchJobSeekerToProjects(projects, userSkills);
  return matchedProjects.filter(project => project.skill_match >= threshold);
};

/**
 * Filter projects that have tasks matching a user's skills
 */
export const filterProjectsWithMatchingTasks = (
  projects: EquityProject[],
  userSkills: Skill[],
  threshold: number = 50
): EquityProject[] => {
  return projects.filter(project => {
    const matchingTasks = findMatchingTasks(project, userSkills, threshold);
    return matchingTasks.length > 0;
  });
};

// Additional utility functions

/**
 * Group skills by category (e.g., technical, soft skills, etc.)
 */
export const categorizeSkills = (skills: Skill[]): Record<string, Skill[]> => {
  const categories: Record<string, Skill[]> = {
    technical: [],
    softSkills: [],
    languages: [],
    other: []
  };

  if (!skills) return categories;

  const technicalKeywords = ['programming', 'development', 'software', 'web', 'database', 'cloud', 'devops', 'engineering'];
  const softSkillKeywords = ['communication', 'leadership', 'teamwork', 'management', 'organization', 'problem solving'];
  const languageKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'italian', 'portuguese', 'russian'];

  skills.forEach(skill => {
    const skillName = typeof skill === 'string' ? skill.toLowerCase() : skill.skill.toLowerCase();
    
    if (technicalKeywords.some(keyword => skillName.includes(keyword))) {
      categories.technical.push(skill);
    } else if (softSkillKeywords.some(keyword => skillName.includes(keyword))) {
      categories.softSkills.push(skill);
    } else if (languageKeywords.some(keyword => skillName.includes(keyword))) {
      categories.languages.push(skill);
    } else {
      categories.other.push(skill);
    }
  });

  return categories;
};

/**
 * Get the skill level text
 */
export const getSkillLevelText = (skill: Skill): string => {
  if (typeof skill === 'string') return 'Intermediate';
  
  const levelMap: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'expert': 'Expert'
  };
  
  return levelMap[skill.level?.toLowerCase()] || 'Intermediate';
};

/**
 * Get a skill's display name regardless of format
 */
export const getSkillName = (skill: Skill): string => {
  if (typeof skill === 'string') return skill;
  return skill.skill || '';
};
