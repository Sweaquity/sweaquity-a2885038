
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject } from "@/types/jobSeeker";

interface EquityTabProps {
  projects: EquityProject[];
  logEffort: {
    projectId: string;
    hours: number;
    description: string;
  };
  onLogEffort: (projectId: string) => void;
  onLogEffortChange: (projectId: string, field: 'hours' | 'description', value: string | number) => void;
}

export const EquityTab = ({
  projects,
  logEffort,
  onLogEffort,
  onLogEffortChange
}: EquityTabProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you're eligible for equity in</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="border p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="font-medium">Company/Project</p>
                  <p>{project.business_roles?.title || project.title || 'Untitled Project'}</p>
                </div>
                <div>
                  <p className="font-medium">Total Hours</p>
                  <p>{project.total_hours_logged || 0}</p>
                </div>
                <div>
                  <p className="font-medium">Equity Earned</p>
                  <p>{project.equity_amount}%</p>
                </div>
                <div>
                  <p className="font-medium">Project Value</p>
                  <p>TBD</p>
                </div>
              </div>
              <div className="space-y-2">
                <button onClick={() => onLogEffort(project.id)}>Log Effort</button>
                <input
                  type="number"
                  value={logEffort.projectId === project.id ? logEffort.hours : ''}
                  onChange={(e) => onLogEffortChange(project.id, 'hours', e.target.value)}
                  placeholder="Hours"
                />
                <input
                  type="text"
                  value={logEffort.projectId === project.id ? logEffort.description : ''}
                  onChange={(e) => onLogEffortChange(project.id, 'description', e.target.value)}
                  placeholder="Description"
                />
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-muted-foreground">No active equity projects found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
