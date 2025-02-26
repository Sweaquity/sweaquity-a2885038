
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/types/jobSeeker";

interface ApplicationsTabProps {
  applications: JobApplication[];
}

export const ApplicationsTab = ({ applications }: ApplicationsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map(application => (
            <div key={application.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="font-medium">Task</p>
                  <p>{application.task?.title || 'Task title not available'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {application.project?.title || 'Project not available'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Status</p>
                  <Badge 
                    variant={application.status === 'pending' ? 'secondary' : 
                            application.status === 'accepted' ? 'success' : 'destructive'}
                  >
                    {application.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">Applied Date</p>
                  <p>{new Date(application.applied_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Potential Equity</p>
                  <p>{application.task?.equity_allocation || 0}%</p>
                </div>
              </div>
            </div>
          ))}
          {applications.length === 0 && (
            <p className="text-muted-foreground">No applications found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
