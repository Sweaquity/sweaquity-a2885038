import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkillRequirement } from "@/types/jobSeeker";
import { Link } from "react-router-dom";

interface TaskCardProps {
  task: {
    task_id: string;
    project_id: string;
    title: string;
    description: string;
    timeframe: string;
    equity_allocation: number;
    skill_requirements: SkillRequirement[];
    skills_required: string[];
    status: string;
    task_status: string;
    completion_percentage: number;
    matchScore?: number;
    matchedSkills?: string[];
  };
  userSkills: { skill: string; level: string }[];
  showMatchedSkills?: boolean;
}

export const TaskCard = ({ 
  task,
  userSkills,
  showMatchedSkills = false,
}: TaskCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
            {task.timeframe && (
              <div className="text-sm text-muted-foreground mb-1">
                Timeframe: {task.timeframe}
              </div>
            )}
          </div>
          
          {task.matchScore !== undefined && (
            <Badge
              variant="secondary"
              className={
                task.matchScore >= 75 
                  ? 'bg-green-100 text-green-800' 
                  : task.matchScore >= 50 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
              }
            >
              {Math.round(task.matchScore)}% Match
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 space-y-3">
        <div className="text-sm line-clamp-3">
          {task.description || 'No description provided.'}
        </div>
        
        <div className="flex items-center space-x-1">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{task.equity_allocation}% Equity</span>
        </div>
        
        {task.skill_requirements && task.skill_requirements.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">Skills Required:</div>
            <div className="flex flex-wrap gap-1">
              {task.skill_requirements.map((skillReq, index) => {
                const userHasSkill = userSkills.some(
                  us => us.skill.toLowerCase() === skillReq.skill.toLowerCase()
                );
                const isMatched = showMatchedSkills && task.matchedSkills?.includes(skillReq.skill);
                
                return (
                  <Badge
                    key={index}
                    variant={userHasSkill || isMatched ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {skillReq.skill}
                    {(userHasSkill || isMatched) && " ✓"}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <Link 
            to={`/projects/apply/${task.project_id}/${task.task_id}`}
          >
            <Button className="w-full">
              Apply Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
