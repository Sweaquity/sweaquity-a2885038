
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface JobApplication {
  id: string;
  role_id: string;
  status: string;
  applied_at: string;
  notes: string;
  business_roles?: {
    title: string;
    description: string;
  };
}

interface ApplicationsListProps {
  applications: JobApplication[];
}

export const ApplicationsList = ({ applications }: ApplicationsListProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Current Applications</h2>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border p-4 rounded-lg">
                <h3 className="font-medium">{application.business_roles?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Status: {application.status}
                </p>
                <p className="text-sm text-muted-foreground">
                  Applied: {new Date(application.applied_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No current applications.</p>
        )}
      </CardContent>
    </Card>
  );
};
