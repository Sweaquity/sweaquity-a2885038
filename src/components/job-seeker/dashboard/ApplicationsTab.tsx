
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, ExternalLink } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ApplicationsTabProps {
  applications: JobApplication[];
}

export const ApplicationsTab = ({ applications }: ApplicationsTabProps) => {
  const handleWithdraw = async (applicationId: string, taskId: string) => {
    try {
      // First, update the application status to 'withdrawn'
      const { error: applicationError } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);

      if (applicationError) {
        console.error("Error updating application:", applicationError);
        throw applicationError;
      }
      
      // Then, update the task status to 'open'
      const { error: taskError } = await supabase
        .from('project_sub_tasks')
        .update({ 
          status: 'open',
          task_status: 'open'
        })
        .eq('id', taskId);
        
      if (taskError) {
        console.error("Error updating task:", taskError);
        throw taskError;
      }
      
      toast.success("Application withdrawn successfully");
      
      // Wait a moment to ensure the database updates are complete
      setTimeout(() => {
        window.location.href = "/seeker/dashboard?tab=applications";
      }, 500);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Failed to withdraw application");
    }
  };

  const openCV = (cvUrl: string) => {
    window.open(cvUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.length === 0 && (
            <p className="text-muted-foreground">No applications found.</p>
          )}
          
          {applications.map(application => (
            <div key={application.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
              {/* Mobile view */}
              <div className="block md:hidden space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Link 
                      to={`/projects/${application.project_id}`}
                      className="font-medium hover:text-blue-600 hover:underline"
                    >
                      {application.business_roles?.title || 'N/A'}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {application.business_roles?.company_name || 'N/A'} • {application.business_roles?.project_title || 'N/A'}
                    </p>
                  </div>
                  <Badge 
                    variant={application.status === 'pending' ? 'secondary' : 
                            application.status === 'accepted' ? 'default' : 'destructive'}
                  >
                    {application.status}
                  </Badge>
                </div>
                
                {application.business_roles?.skills_required && (
                  <div className="flex flex-wrap gap-1">
                    {application.business_roles.skills_required.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {(application.business_roles.skills_required.length > 3) && (
                      <span className="text-xs text-muted-foreground">
                        +{application.business_roles.skills_required.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Applied: {new Date(application.applied_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {application.cv_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCV(application.cv_url!)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {application.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleWithdraw(application.id, application.task_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop view */}
              <div className="hidden md:flex items-center justify-between gap-4">
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
                    <Link 
                      to={`/projects/${application.project_id}`}
                      className="truncate hover:text-blue-600 hover:underline"
                    >
                      {application.business_roles?.title || 'N/A'}
                    </Link>
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
                <div className="flex items-center gap-2">
                  {application.cv_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="View CV"
                      onClick={() => openCV(application.cv_url!)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  {application.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleWithdraw(application.id, application.task_id)}
                      title="Withdraw application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
