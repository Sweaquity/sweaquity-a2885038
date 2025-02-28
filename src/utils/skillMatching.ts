
import { EquityProject, Skill, SubTask } from "@/types/jobSeeker";

interface MatchedTask extends Omit<SubTask, 'skill_requirements'> {
  matchScore: number;
  matchedSkills: string[];
}

interface ProjectMatch {
  projectId: string;
  projectTitle: string;
  matchScore: number;
  matchedTasks: MatchedTask[];
}

// Function to calculate detailed skill match between a task and user skills
const calculateSkillMatch = (taskSkills: string[], userSkills: Skill[]): { 
  matchScore: number;
  matchedSkills: string[];
} => {
  if (!taskSkills || taskSkills.length === 0) {
    return { matchScore: 0, matchedSkills: [] };
  }

  const userSkillNames = userSkills.map(skill => skill.skill.toLowerCase());
  
  // Find matching skills
  const matchedSkills: string[] = [];
  let totalWeightedScore = 0;
  
  taskSkills.forEach(requiredSkill => {
    const lowerSkill = requiredSkill.toLowerCase();
    const matchIndex = userSkillNames.indexOf(lowerSkill);
    
    if (matchIndex >= 0) {
      matchedSkills.push(requiredSkill);
      
      // Add weighted score based on skill level
      const userSkill = userSkills[matchIndex];
      switch (userSkill.level) {
        case 'Expert':
          totalWeightedScore += 1.2;
          break;
        case 'Intermediate':
          totalWeightedScore += 1.0;
          break;
        case 'Beginner':
          totalWeightedScore += 0.8;
          break;
        default:
          totalWeightedScore += 1.0;
      }
    }
  });
  
  // Calculate percentage match
  const matchScore = Math.round((totalWeightedScore / taskSkills.length) * 100);
  
  return { matchScore, matchedSkills };
};

// Main function to get project matches based on user skills
export const getProjectMatches = (projects: EquityProject[], userSkills: Skill[]): ProjectMatch[] => {
  console.log("Starting matching process with data:", {
    totalProjects: projects.length,
    userSkills,
    projects: projects.map(p => ({ 
      title: p.title, 
      id: p.id,
      project_id: p.project_id,
      tasks: p.sub_tasks?.map(t => ({
        title: t.title,
        requirements: t.skill_requirements
      }))
    }))
  });

  const projectMatches: ProjectMatch[] = [];
  const processedProjectIds = new Set<string>();

  projects.forEach(project => {
    // Skip if we've already processed this project (by projectId)
    if (project.project_id && processedProjectIds.has(project.project_id)) {
      return;
    }
    
    console.log("\nAnalyzing project:", {
      title: project.title,
      id: project.id,
      project_id: project.project_id,
      subTasks: project.sub_tasks?.length || 0
    });

    // Skip projects with no sub-tasks
    if (!project.sub_tasks || project.sub_tasks.length === 0) {
      console.log("Skipping project with no subtasks:", project.id);
      return;
    }

    const matchedTasks: MatchedTask[] = [];
    let totalProjectScore = 0;

    project.sub_tasks.forEach(task => {
      console.log("\nAnalyzing task:", {
        title: task.title,
        requirements: task.skill_requirements || task.skills_required
      });

      // Use skill_requirements first, fall back to skills_required
      const skillsToMatch = task.skill_requirements?.map(sr => sr.skill) || 
                          task.skills_required || [];

      // Calculate match for this task
      const { matchScore, matchedSkills } = calculateSkillMatch(skillsToMatch, userSkills);
      console.log("Task match results:", {
        title: task.title,
        matchedSkills,
        totalRequired: skillsToMatch.length,
        matchScore
      });

      // If there's any match at all (minimum threshold)
      if (matchScore > 0) {
        matchedTasks.push({
          ...task, // Include all SubTask properties
          matchScore,
          matchedSkills
        });
        totalProjectScore += matchScore;
      }
    });

    // If we found any matching tasks
    if (matchedTasks.length > 0) {
      // Calculate average match score for the project
      const avgProjectScore = totalProjectScore / project.sub_tasks.length;
      
      console.log("Project match summary:", {
        title: project.title,
        matchedTasks: matchedTasks.length,
        score: avgProjectScore
      });

      // Mark this project as processed
      if (project.project_id) {
        processedProjectIds.add(project.project_id);
      }

      projectMatches.push({
        projectId: project.project_id || project.id,
        projectTitle: project.title || project.business_roles?.project_title || 'Unnamed Project',
        matchScore: avgProjectScore,
        matchedTasks
      });
    }
  });

  // Sort projects by match score
  return projectMatches.sort((a, b) => b.matchScore - a.matchScore);
};
