
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EquityProject {
  id: string;
  project_id: string;
  equity_amount: number;
  time_allocated: string;
  status: string;
  start_date: string;
  end_date?: string;
  effort_logs: {
    date: string;
    hours: number;
    description: string;
  }[];
  total_hours_logged: number;
  business_roles?: {
    title: string;
    description: string;
  };
}

interface EquityProjectsListProps {
  projects: EquityProject[];
  logEffort: {
    projectId: string;
    hours: number;
    description: string;
  };
  onLogEffort: (projectId: string) => void;
  onLogEffortChange: (projectId: string, field: 'hours' | 'description', value: string | number) => void;
}

export const EquityProjectsList = ({
  projects,
  logEffort,
  onLogEffort,
  onLogEffortChange,
}: EquityProjectsListProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Current Equity Projects</h2>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="border p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{project.business_roles?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Equity Amount: {project.equity_amount}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Hours: {project.total_hours_logged || 0}
                  </p>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Log Effort</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`hours-${project.id}`}>Hours</Label>
                      <Input
                        id={`hours-${project.id}`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={project.id === logEffort.projectId ? logEffort.hours : ''}
                        onChange={(e) => onLogEffortChange(project.id, 'hours', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`description-${project.id}`}>Description</Label>
                      <Input
                        id={`description-${project.id}`}
                        value={project.id === logEffort.projectId ? logEffort.description : ''}
                        onChange={(e) => onLogEffortChange(project.id, 'description', e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={() => onLogEffort(project.id)}
                      disabled={!logEffort.hours || !logEffort.description || logEffort.projectId !== project.id}
                    >
                      Log Effort
                    </Button>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Effort History</h4>
                    <div className="space-y-2">
                      {project.effort_logs?.map((log, index) => (
                        <div key={index} className="text-sm border p-2 rounded">
                          <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
                          <p>Hours: {log.hours}</p>
                          <p className="text-muted-foreground">{log.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No current equity projects.</p>
        )}
      </CardContent>
    </Card>
  );
};
