
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubTask, Skill } from "@/types/jobSeeker";
import { useNavigate } from "react-router-dom";

interface TaskCardProps {
  task: SubTask;
  userSkills: Skill[];
}

export const TaskCard = ({ task, userSkills }: TaskCardProps) => {
  const navigate = useNavigate();

  const handleApply = () => {
    navigate(`/projects/${task.project_id}/apply`);
  };

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
            <p className="text-sm font-medium mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-2">
              {task.skill_requirements.map((req, index) => (
                <Badge 
                  key={index}
                  variant={userSkills.some(s => s.skill === req.skill) ? "default" : "secondary"}
                >
                  {req.skill} ({req.level})
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Timeframe: {task.timeframe}</span>
            <Button onClick={handleApply}>Apply Now</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
