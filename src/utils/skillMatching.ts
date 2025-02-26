
import { Skill, SkillRequirement, EquityProject, SubTask } from "@/types/jobSeeker";

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
  // Normalize skill names for comparison
  const normalizedUserSkill = userSkill.skill.toLowerCase().trim();
  const normalizedRequiredSkill = requiredSkill.skill.toLowerCase().trim();
  
  const userLevel = getSkillLevel(userSkill.level);
  const requiredLevel = getSkillLevel(requiredSkill.level);
  
  console.log('Skill comparison:', {
    userSkill: normalizedUserSkill,
    userLevel: userSkill.level,
    requiredSkill: normalizedRequiredSkill,
    requiredLevel: requiredSkill.level,
    userLevelNum: userLevel,
    requiredLevelNum: requiredLevel
  });
  
  const matches = normalizedUserSkill === normalizedRequiredSkill && userLevel >= requiredLevel;
  console.log(`Match result for ${normalizedUserSkill}: ${matches}`);
  
  return matches;
};

interface MatchedTask extends SubTask {
  matchScore: number;
  projectId: string;
  projectTitle: string;
  matchedSkills: SkillRequirement[];
}

interface ProjectMatch {
  projectId: string;
  projectTitle: string;
  matchScore: number;
  matchedTasks: MatchedTask[];
}

export const getProjectMatches = (projects: EquityProject[], userSkills: Skill[]): ProjectMatch[] => {
  console.log('Starting matching process with data:', {
    totalProjects: projects.length,
    userSkills: userSkills,
    projects: projects.map(p => ({
      title: p.title || p.business_roles?.title,
      id: p.project_id,
      tasks: p.sub_tasks?.map(t => ({
        title: t.title,
        requirements: t.skill_requirements
      }))
    }))
  });

  const matchedProjects = projects.map(project => {
    console.log('\nAnalyzing project:', {
      title: project.title || project.business_roles?.title,
      id: project.project_id,
      subTasks: project.sub_tasks?.length || 0
    });
    
    const tasksWithMatches = (project.sub_tasks || []).map(task => {
      console.log('\nAnalyzing task:', {
        title: task.title,
        requirements: task.skill_requirements
      });
      
      const matchedSkills = (task.skill_requirements || []).filter(required =>
        userSkills.some(userSkill => hasRequiredSkillLevel(userSkill, required))
      );

      const matchScore = task.skill_requirements?.length 
        ? (matchedSkills.length / task.skill_requirements.length) * 100 
        : 0;
      
      console.log('Task match results:', {
        title: task.title,
        matchedSkills,
        totalRequired: task.skill_requirements?.length || 0,
        matchScore
      });

      return {
        ...task,
        matchedSkills,
        matchScore,
        projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
        projectId: project.project_id
      };
    });

    const matchedTasks = tasksWithMatches.filter(task => task.matchScore > 0);
    const projectMatchScore = matchedTasks.length > 0 
      ? matchedTasks.reduce((sum, task) => sum + task.matchScore, 0) / matchedTasks.length
      : 0;

    console.log('Project match summary:', {
      title: project.title || project.business_roles?.title,
      matchedTasks: matchedTasks.length,
      score: projectMatchScore
    });

    return {
      projectId: project.project_id,
      projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
      matchScore: projectMatchScore,
      matchedTasks
    };
  });

  return matchedProjects
    .filter(project => project.matchedTasks.length > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};
