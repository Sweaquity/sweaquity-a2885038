
import { Skill, SkillRequirement, EquityProject } from "@/types/jobSeeker";

export const getSkillLevel = (level: string): number => {
  const levels = {
    'Beginner': 1,
    'beginner': 1,
    'Intermediate': 2,
    'intermediate': 2,
    'Expert': 3,
    'expert': 3
  };
  return levels[level as keyof typeof levels] || 0;
};

export const hasRequiredSkillLevel = (userSkill: Skill, requiredSkill: SkillRequirement) => {
  const userLevel = getSkillLevel(userSkill.level);
  const requiredLevel = getSkillLevel(requiredSkill.level);
  return userSkill.skill.toLowerCase() === requiredSkill.skill.toLowerCase() && userLevel >= requiredLevel;
};

export const getProjectMatches = (projects: EquityProject[], userSkills: Skill[]) => {
  const matchedProjects = projects.map(project => {
    // Get all tasks with their match scores
    const tasksWithMatches = (project.sub_tasks || []).map(task => {
      const matchedSkills = (task.skill_requirements || []).filter(required =>
        userSkills.some(userSkill => hasRequiredSkillLevel(userSkill, required))
      );

      const matchScore = task.skill_requirements ? 
        (matchedSkills.length / task.skill_requirements.length) * 100 : 0;

      return {
        ...task,
        matchedSkills,
        matchScore,
        projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
        projectId: project.project_id
      };
    });

    // Filter tasks that have at least one skill match
    const matchedTasks = tasksWithMatches.filter(task => task.matchScore > 0);

    // Calculate overall project match score
    const projectMatchScore = matchedTasks.length > 0 
      ? matchedTasks.reduce((sum, task) => sum + task.matchScore, 0) / matchedTasks.length
      : 0;

    return {
      projectId: project.project_id,
      projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
      matchScore: projectMatchScore,
      matchedTasks
    };
  });

  // Filter and sort projects by match score
  return matchedProjects
    .filter(project => project.matchedTasks.length > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};
