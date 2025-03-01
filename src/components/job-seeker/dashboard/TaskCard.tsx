
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { SubTask } from "@/types/jobSeeker";

interface TaskCardProps {
  task: SubTask;
  matchScore?: number;
  projectTitle?: string;
}

export const TaskCard = ({ task, matchScore, projectTitle }: TaskCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              {projectTitle && (
                <p className="text-sm text-muted-foreground">{projectTitle}</p>
              )}
            </div>
            <Badge variant={matchScore && matchScore > 70 ? "default" : "secondary"}>
              {matchScore || 0}% match
            </Badge>
          </div>

          <p className="text-sm line-clamp-2">{task.description}</p>

          <div className="flex flex-wrap gap-1">
            {task.skills_required?.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {task.skills_required && task.skills_required.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{task.skills_required.length - 3} more
              </span>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{task.equity_allocation}%</span> equity
              {task.timeframe && <span> • {task.timeframe}</span>}
            </div>
            <Link to={`/projects/apply/${task.project_id}`} state={{ selectedTaskId: task.task_id }}>
              <Button size="sm" className="gap-1">
                Apply <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
