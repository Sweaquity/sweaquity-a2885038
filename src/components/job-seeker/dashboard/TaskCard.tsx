
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skill } from "@/types/jobSeeker";
import { SkillBadge } from "./SkillBadge";
import { useNavigate } from "react-router-dom";

interface Task {
  task_id: string;
  project_id: string;
  title: string;
  description: string;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
  skill_requirements: Array<{skill: string, level: string}>;
  status: string;
  task_status: string;
  completion_percentage: number;
  matchedSkills?: string[];
  matchScore?: number;
}

interface TaskCardProps {
  task: Task;
  userSkills: Skill[];
  showMatchedSkills?: boolean;
  companyName?: string;
  projectTitle?: string;
}

export const TaskCard = ({ 
  task, 
  userSkills, 
  showMatchedSkills = false, 
  companyName,
  projectTitle
}: TaskCardProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    navigate(`/projects/${task.project_id}/apply`, { 
      state: { 
        taskId: task.task_id,
        taskTitle: task.title,
        projectTitle: projectTitle,
        companyName: companyName
      } 
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Find if the skills match with user skills
  // Convert the string skills to Skill objects for proper comparison
  const matchingSkills = userSkills.filter(
    userSkill => task.skills_required.some(
      requiredSkill => requiredSkill.toLowerCase() === userSkill.skill.toLowerCase()
    )
  );

  // Calculate match percentage
  const matchPercentage = task.skills_required.length > 0 
    ? Math.round((matchingSkills.length / task.skills_required.length) * 100) 
    : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base">{task.title}</CardTitle>
          <Badge 
            variant={
              task.status === 'completed' ? 'outline' :
              task.status === 'in-progress' ? 'secondary' : 'default'
            }
          >
            {task.status}
          </Badge>
        </div>
        {(projectTitle || companyName) && (
          <div className="text-sm text-muted-foreground">
            {projectTitle && <div>Project: {projectTitle}</div>}
            {companyName && <div>Company: {companyName}</div>}
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2">
          <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
            {task.description || "No description provided"}
          </p>
          {task.description && task.description.length > 100 && (
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={toggleExpand}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-muted-foreground">Equity:</div>
            <div>{task.equity_allocation}%</div>
            <div className="text-muted-foreground">Timeframe:</div>
            <div>{task.timeframe}</div>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Skills Required:</p>
            <div className="flex flex-wrap gap-1">
              {task.skills_required.map((skill, index) => (
                <Badge 
                  key={`${skill}-${index}`} 
                  variant={showMatchedSkills && task.matchedSkills?.includes(skill) ? "secondary" : "outline"}
                  className={showMatchedSkills && task.matchedSkills?.includes(skill) ? "bg-green-100 text-green-800" : ""}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          
          {showMatchedSkills && task.matchScore !== undefined && (
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={
                  task.matchScore >= 75 ? 'bg-green-50 text-green-700' : 
                  task.matchScore >= 50 ? 'bg-yellow-50 text-yellow-700' : 
                  'bg-orange-50 text-orange-700'
                }>
                {Math.round(task.matchScore)}% skills match
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          onClick={handleApply} 
          className="w-full"
        >
          Apply for this Role
        </Button>
      </CardFooter>
    </Card>
  );
};
