
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
  const userLevel = getSkillLevel(userSkill.level);
  const requiredLevel = getSkillLevel(requiredSkill.level);
  
  console.log(`Comparing skill: ${userSkill.skill} (${userSkill.level}) with required: ${requiredSkill.skill} (${requiredSkill.level})`);
  console.log(`Levels converted: User=${userLevel}, Required=${requiredLevel}`);
  
  const matches = userSkill.skill.toLowerCase() === requiredSkill.skill.toLowerCase() && userLevel >= requiredLevel;
  console.log(`Match result: ${matches}`);
  
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
  console.log('Starting project matching process');
  console.log('User skills:', userSkills);
  
  const matchedProjects = projects.map(project => {
    console.log('\nProcessing project:', project.title || project.business_roles?.title);
    console.log('Project ID:', project.project_id);
    
    // Get all tasks with their match scores
    const tasksWithMatches = (project.sub_tasks || []).map(task => {
      console.log('\n  Processing task:', task.title);
      console.log('  Required skills:', task.skill_requirements);
      
      const matchedSkills = (task.skill_requirements || []).filter(required =>
        userSkills.some(userSkill => hasRequiredSkillLevel(userSkill, required))
      );

      const matchScore = task.skill_requirements ? 
        (matchedSkills.length / task.skill_requirements.length) * 100 : 0;
      
      console.log('  Matched skills:', matchedSkills);
      console.log(`  Task match score: ${matchScore}%`);

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

    console.log('\nProject summary:');
    console.log(`Total matched tasks: ${matchedTasks.length}`);
    console.log(`Overall project match score: ${projectMatchScore}%`);

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
