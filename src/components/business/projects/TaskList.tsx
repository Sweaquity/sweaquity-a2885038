
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
  skill_requirements: any[];
  dependencies: string[];
}

interface TaskListProps {
  projectId: string;
  tasks: Task[];
}

export const TaskList = ({ tasks }: TaskListProps) => {
  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="border p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
              <div className="mt-2">
                <p className="text-sm font-medium">Required Skills:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {task.skill_requirements.map((skillReq: any, index: number) => (
                    <span key={index} className="px-2 py-1 bg-secondary rounded-full text-xs">
                      {skillReq.skill} - {skillReq.level}
                    </span>
                  ))}
                </div>
              </div>
              {task.dependencies.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Dependencies:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.dependencies.map(dep => (
                      <span key={dep} className="px-2 py-1 bg-secondary rounded-full text-xs">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
  );
};
