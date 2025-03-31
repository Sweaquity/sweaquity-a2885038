import { Skill } from '@/types/profile';

export const calculateSkillMatch = (userSkills: string[], requiredSkills: string[]): number => {
  if (!userSkills || !requiredSkills || requiredSkills.length === 0) {
    return 0;
  }

  const matchedSkills = userSkills.filter(skill =>
    requiredSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
  );

  return Math.round((matchedSkills.length / requiredSkills.length) * 100);
};

export const findBestMatchingTasks = (tasks: any[], userSkills: string[]): any[] => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0 || !userSkills || !Array.isArray(userSkills)) {
    return [];
  }

  return tasks.map(task => {
    const requiredSkills = task.skills_required || [];
    const skillMatch = calculateSkillMatch(userSkills, requiredSkills);
    return { ...task, skillMatch };
  }).sort((a, b) => b.skillMatch - a.skillMatch);
};

export const getTaskSkillMatch = (task: any, userSkills: string[]): { percentage: number; count: number; total: number } => {
  if (!task || !userSkills || !Array.isArray(userSkills) || userSkills.length === 0) {
    return { percentage: 0, count: 0, total: 0 };
  }

  // Normalize user skills to lowercase for case-insensitive matching
  const normalizedUserSkills = userSkills.map(skill => typeof skill === 'string' ? skill.toLowerCase() : '');

  // Handle task skills from task.skills_required
  let taskSkills = [];
  if (task.skills_required && Array.isArray(task.skills_required)) {
    taskSkills = task.skills_required.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
      if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
      return '';
    }).filter(Boolean);
  }

  // For backward compatibility, also check skill_requirements if present
  if (taskSkills.length === 0 && task.skill_requirements && Array.isArray(task.skill_requirements)) {
    taskSkills = task.skill_requirements.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
      if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
      return '';
    }).filter(Boolean);
  }

  if (taskSkills.length === 0) {
    return { percentage: 0, count: 0, total: 0 };
  }

  // Count how many user skills match the task skills
  const matchCount = normalizedUserSkills.filter(userSkill => taskSkills.includes(userSkill)).length;

  // Calculate the match percentage
  const matchPercentage = Math.round((matchCount / taskSkills.length) * 100);

  return {
    percentage: matchPercentage,
    count: matchCount,
    total: taskSkills.length
  };
};

export const findMatchingProjectsForJobSeeker = (projects: any[], userSkills: (string | Skill)[]): any[] => {
  if (!projects || !Array.isArray(projects) || projects.length === 0 || !userSkills || !Array.isArray(userSkills)) {
    return [];
  }

  // Normalize user skills to strings
  const userSkillStrings = userSkills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
    if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
    return '';
  }).filter(Boolean);

  return projects.map(project => {
    const requiredSkills = project.skills_required || [];
    const matchCount = userSkillStrings.filter(userSkill =>
      requiredSkills.map(s => s.toLowerCase()).includes(userSkill)
    ).length;
    const matchPercentage = requiredSkills.length > 0 ? Math.round((matchCount / requiredSkills.length) * 100) : 0;

    return {
      ...project,
      skill_match: matchPercentage
    };
  }).sort((a, b) => b.skill_match - a.skill_match);
};

export const findMatchingTasksForJobSeeker = (tasks: any[], userSkills: (string | Skill)[]): any[] => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0 || !userSkills || !Array.isArray(userSkills)) {
    return [];
  }

  // Normalize user skills to strings
  const userSkillStrings = userSkills.map(skill => {
    if (typeof skill === 'string') return skill.toLowerCase();
    if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
    if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
    return '';
  }).filter(Boolean);

  // Calculate match for each task and sort by match percentage
  return tasks.map(task => {
    // Get task skills
    let taskSkills: string[] = [];
    
    if (task.skills_required && Array.isArray(task.skills_required)) {
      taskSkills = task.skills_required.map(skill => {
        if (typeof skill === 'string') return skill.toLowerCase();
        if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
        if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
        return '';
      }).filter(Boolean);
    }
    
    // For backward compatibility, also check skill_requirements
    if (taskSkills.length === 0 && task.skill_requirements && Array.isArray(task.skill_requirements)) {
      taskSkills = task.skill_requirements.map(skill => {
        if (typeof skill === 'string') return skill.toLowerCase();
        if (skill && typeof skill === 'object' && skill.skill) return skill.skill.toLowerCase();
        if (skill && typeof skill === 'object' && skill.name) return skill.name.toLowerCase();
        return '';
      }).filter(Boolean);
    }

    // Count matches
    const matchCount = userSkillStrings.filter(userSkill => taskSkills.includes(userSkill)).length;
    const matchPercentage = taskSkills.length > 0 ? Math.round((matchCount / taskSkills.length) * 100) : 0;

    return {
      ...task,
      skill_match: {
        percentage: matchPercentage,
        count: matchCount,
        total: taskSkills.length
      }
    };
  }).sort((a, b) => b.skill_match.percentage - a.skill_match.percentage);
};
