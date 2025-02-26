
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
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="font-medium mb-1">Company</p>
                    <p className="text-sm">{application.business_roles?.company_name || 'Company name not available'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Project</p>
                    <p className="text-sm">{application.business_roles?.project_title || 'Project title not available'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Task Title</p>
                    <p className="text-sm">{application.business_roles?.title || 'Task title not available'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium mb-1">Skills Required</p>
                    <div className="flex flex-wrap gap-1">
                      {application.business_roles?.skills_required?.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      )) || 'No skills listed'}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Status</p>
                    <Badge 
                      variant={application.status === 'pending' ? 'secondary' : 
                              application.status === 'accepted' ? 'default' : 'destructive'}
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Timeframe</p>
                    <p className="text-sm">{application.business_roles?.timeframe || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Applied Date</p>
                    <p className="text-sm">{new Date(application.applied_at).toLocaleDateString()}</p>
                  </div>
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
