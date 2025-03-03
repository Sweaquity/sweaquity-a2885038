
import { Progress } from "@/components/ui/progress";

interface ApplicationContentProps {
  description: string;
  timeframe: string;
  equityAllocation?: number;
  taskStatus: string;
  completionPercentage: number;
}

export const ApplicationContent = ({
  description,
  timeframe,
  equityAllocation,
  taskStatus,
  completionPercentage
}: ApplicationContentProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Description</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Timeframe</p>
          <p className="font-medium">{timeframe || "Not specified"}</p>
        </div>
        
        <div>
          <p className="text-muted-foreground">Equity Allocation</p>
          <p className="font-medium">{equityAllocation ? `${equityAllocation}%` : "Not specified"}</p>
        </div>
        
        <div>
          <p className="text-muted-foreground">Task Status</p>
          <p className="font-medium capitalize">{taskStatus || "Not started"}</p>
        </div>
      </div>
      
      {completionPercentage > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
};
