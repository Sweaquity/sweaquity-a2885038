
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
              <a href={`/projects/${application.role_id}`} className="block">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">Company/Project</p>
                    <p>{application.business_roles?.title || 'Untitled Project'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="capitalize">{application.status}</p>
                  </div>
                  <div>
                    <p className="font-medium">Applied Date</p>
                    <p>{new Date(application.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Project Value</p>
                    <p>TBD</p>
                  </div>
                </div>
              </a>
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
