
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skill } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";

interface TaskCardProps {
  task: {
    id: string;
    task_id: string;
    project_id: string;
    title: string;
    description: string;
    equity_allocation: number;
    skills_required?: string[];
    skill_requirements?: { skill: string; level: string }[];
    timeframe?: string;
    matchScore?: number;
    matchedSkills?: string[];
    status?: string;
    task_status?: string;
    completion_percentage?: number;
  };
  userSkills: Skill[];
  showMatchedSkills?: boolean;
}

export const TaskCard = ({ task, userSkills, showMatchedSkills = false }: TaskCardProps) => {
  const navigate = useNavigate();

  const handleApply = () => {
    navigate(`/projects/${task.project_id}/apply?taskId=${task.task_id}`);
  };

  // Use matching skill requirements if available, otherwise use regular skill_requirements, finally fallback to skills_required
  const skillRequirements = showMatchedSkills && task.matchedSkills 
    ? task.matchedSkills.map(skill => ({ skill, level: 'Matched' }))
    : task.skill_requirements || 
      (task.skills_required?.map(skill => ({ skill, level: 'Unknown' })) || []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <Badge>{task.equity_allocation}% equity</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">
              {showMatchedSkills ? "Matched Skills:" : "Required Skills:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {skillRequirements && skillRequirements.map((req, index) => (
                <Badge 
                  key={index}
                  variant={
                    req.level === 'Matched' || 
                    userSkills.some(s => s.skill.toLowerCase() === req.skill.toLowerCase()) 
                      ? "default" 
                      : "secondary"
                  }
                >
                  {req.skill} {req.level !== 'Unknown' && req.level !== 'Matched' ? `(${req.level})` : ''}
                  {(req.level === 'Matched' || userSkills.some(s => s.skill.toLowerCase() === req.skill.toLowerCase())) && " ✓"}
                </Badge>
              ))}
            </div>
          </div>
          
          {task.matchScore !== undefined && (
            <div>
              <p className="text-sm font-medium mb-2">Skill Match:</p>
              <div className="w-full bg-secondary h-2 rounded-full">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${task.matchScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {task.matchScore}% match with your skills
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Timeframe: {task.timeframe}</span>
            <Button onClick={handleApply}>Apply Now</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
