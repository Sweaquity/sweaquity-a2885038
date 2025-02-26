
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ApplicationsTabProps {
  applications: JobApplication[];
}

export const ApplicationsTab = ({ applications }: ApplicationsTabProps) => {
  const handleWithdraw = async (applicationId: string) => {
    try {
      // Update the application status to 'withdrawn'
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);

      if (updateError) throw updateError;
      
      toast.success("Application withdrawn successfully");
      // Reload the page to refresh the applications list
      window.location.reload();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Failed to withdraw application");
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map(application => (
            <div key={application.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="grid grid-cols-6 flex-1 gap-6">
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Company</p>
                    <p className="truncate">{application.business_roles?.company_name || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Project</p>
                    <p className="truncate">{application.business_roles?.project_title || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Task</p>
                    <p className="truncate">{application.business_roles?.title || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {application.business_roles?.skills_required?.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(application.business_roles?.skills_required?.length || 0) > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{(application.business_roles?.skills_required?.length || 0) - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge 
                      variant={application.status === 'pending' ? 'secondary' : 
                              application.status === 'accepted' ? 'default' : 'destructive'}
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-muted-foreground">Applied</p>
                    <p className="text-sm">{new Date(application.applied_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {application.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleWithdraw(application.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
