
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { EquityProject, Skill } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: EquityProject[];
  userSkills: Skill[];
}

export const OpportunitiesTab = ({ projects, userSkills }: OpportunitiesTabProps) => {
  const getSkillMatchCount = (projectSkills: string[] | undefined, userSkills: Skill[]) => {
    if (!projectSkills) return 0;
    return projectSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.name.toLowerCase() === skill.toLowerCase()
      )
    ).length;
  };

  const getMatchPercentage = (matchCount: number, totalRequired: number) => {
    if (totalRequired === 0) return 0;
    return Math.round((matchCount / totalRequired) * 100);
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const aMatchCount = getSkillMatchCount(a.business_roles?.required_skills, userSkills);
    const bMatchCount = getSkillMatchCount(b.business_roles?.required_skills, userSkills);
    return bMatchCount - aMatchCount;
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Matched Skills Projects</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedProjects.map(project => {
            const requiredSkills = project.business_roles?.required_skills || [];
            const matchedSkillsCount = getSkillMatchCount(requiredSkills, userSkills);
            const matchPercentage = getMatchPercentage(matchedSkillsCount, requiredSkills.length);

            // Only show projects with at least one skill match
            if (matchedSkillsCount === 0) return null;

            return (
              <Link 
                key={project.id} 
                to={`/projects/${project.project_id}`}
                className="block"
              >
                <div className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">
                          {project.business_roles?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {project.business_roles?.description}
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
                        <p className="text-sm">{project.time_allocated}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Equity Available</p>
                        <p className="text-sm">{project.equity_amount}%</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Skills Required</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {requiredSkills.map((skill, index) => (
                            <Badge 
                              key={index}
                              variant="outline"
                              className={
                                userSkills.some(
                                  userSkill => userSkill.name.toLowerCase() === skill.toLowerCase()
                                )
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {sortedProjects.filter(project => 
            getSkillMatchCount(project.business_roles?.required_skills, userSkills) > 0
          ).length === 0 && (
            <p className="text-muted-foreground">No matching opportunities found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
