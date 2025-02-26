
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  hours_logged: number;
  equity_earned: number;
  equity_allocation: number;
  timeframe: string;
  skills_required: string[];
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  equity_allocation: number;
  skills_required: string[];
  project_timeframe: string;
  tasks: Task[];
}

interface ProjectListProps {
  projects: Project[];
}

export const ProjectList = ({ projects }: ProjectListProps) => {
  return (
    <div className="space-y-6">
      {projects.map(project => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{project.title}</h3>
              <span className="text-sm text-muted-foreground">
                Total Equity: {project.equity_allocation}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Required Skills:</p>
              <p className="text-xs text-muted-foreground mb-2">
                These skills will be broken down into specific requirements in sub-tasks after project creation.
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.skills_required.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-secondary rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.tasks.map(task => (
                <div key={task.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Required Skills:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {task.skills_required.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-secondary rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Due: {task.timeframe}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Equity allocated: {task.equity_allocation}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
