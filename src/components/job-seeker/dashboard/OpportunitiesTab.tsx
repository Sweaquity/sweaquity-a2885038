
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { EquityProject, Skill } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const getSkillLevel = (level: string): number => {
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

  const hasRequiredSkillLevel = (userSkill: Skill, requiredSkill: { skill: string; level: string }) => {
    const userLevel = getSkillLevel(userSkill.level);
    const requiredLevel = getSkillLevel(requiredSkill.level);
    return userSkill.name.toLowerCase() === requiredSkill.skill.toLowerCase() && userLevel >= requiredLevel;
  };

  const getSkillMatchCount = (taskSkills: { skill: string; level: string }[] | undefined, userSkills: Skill[]) => {
    if (!taskSkills) return 0;
    return taskSkills.filter(requiredSkill => 
      userSkills.some(userSkill => hasRequiredSkillLevel(userSkill, requiredSkill))
    ).length;
  };

  const getMatchPercentage = (matchCount: number, totalRequired: number) => {
    if (totalRequired === 0) return 0;
    return Math.round((matchCount / totalRequired) * 100);
  };

  // Get all tasks from all projects and sort them by skill match
  const matchedTasks = projects.flatMap(project => 
    (project.sub_tasks || []).map(task => ({
      ...task,
      projectId: project.project_id,
      projectTitle: project.business_roles?.title || project.title || 'Untitled Project',
      matchCount: getSkillMatchCount(task.skill_requirements, userSkills)
    }))
  ).filter(task => task.matchCount > 0)
  .sort((a, b) => b.matchCount - a.matchCount);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Matched Skills Tasks</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matchedTasks.map(task => {
            const matchPercentage = getMatchPercentage(
              task.matchCount,
              task.skill_requirements.length
            );

            return (
              <Link 
                key={task.id} 
                to={`/projects/${task.projectId}`}
                className="block"
              >
                <div className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={
                          matchPercentage >= 75 
                            ? 'bg-green-100 text-green-800' 
                            : matchPercentage >= 50 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {matchPercentage}% Match
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium text-sm">Timeframe</p>
                        <p className="text-sm">{task.timeframe}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Equity Available</p>
                        <p className="text-sm">{task.equity_allocation}%</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Skills Required</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.skill_requirements.map((skillReq, index) => {
                            const userHasSkill = userSkills.some(
                              userSkill => hasRequiredSkillLevel(userSkill, skillReq)
                            );
                            
                            return (
                              <Badge 
                                key={index}
                                variant="outline"
                                className={
                                  userHasSkill
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                }
                              >
                                {skillReq.skill} ({skillReq.level})
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {matchedTasks.length === 0 && (
            <p className="text-muted-foreground">No matching tasks found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
