
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SubTask, Skill } from "@/types/jobSeeker";
import { SkillBadge } from "./SkillBadge";

interface TaskCardProps {
  task: SubTask & {
    projectId: string;
    projectTitle: string;
    matchScore: number;
  };
  userSkills: Skill[];
}

export const TaskCard = ({ task, userSkills }: TaskCardProps) => {
  return (
    <Link 
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
                task.matchScore >= 75 
                  ? 'bg-green-100 text-green-800' 
                  : task.matchScore >= 50 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
              }
            >
              {Math.round(task.matchScore)}% Match
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
                {task.skill_requirements.map((skillReq, index) => (
                  <SkillBadge 
                    key={index}
                    skillReq={skillReq}
                    userSkills={userSkills}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
