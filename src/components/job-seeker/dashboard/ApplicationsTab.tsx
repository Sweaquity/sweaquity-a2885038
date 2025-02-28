
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, ChevronDown, MessageSquare } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onApplicationUpdated?: () => void;
}

export const ApplicationsTab = ({ applications, onApplicationUpdated = () => {} }: ApplicationsTabProps) => {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());

  const toggleApplicationExpanded = (applicationId: string) => {
    setExpandedApplications(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(applicationId)) {
        newExpanded.delete(applicationId);
      } else {
        newExpanded.add(applicationId);
      }
      return newExpanded;
    });
  };

  const handleWithdraw = async (applicationId: string, taskId: string) => {
    try {
      setIsWithdrawing(applicationId);
      
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
      onApplicationUpdated();

    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Failed to withdraw application");
    } finally {
      setIsWithdrawing(null);
    }
  };

  const openCV = async (cvUrl: string) => {
    try {
      if (!cvUrl) {
        toast.error("No CV URL provided");
        return;
      }
      
      // Check if storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const cvsBucketExists = buckets?.some(bucket => bucket.name === 'cvs');
      
      if (!cvsBucketExists) {
        console.error("CV bucket does not exist");
        toast.error("CV storage is not properly configured");
        
        // Attempt to create the bucket
        try {
          const { error: bucketError } = await supabase.storage.createBucket('cvs', {
            public: true
          });
          
          if (bucketError) {
            console.error("Error creating cvs bucket:", bucketError);
            toast.error("Failed to create CV storage bucket");
            return;
          } else {
            console.log("Successfully created cvs bucket");
          }
        } catch (bucketErr) {
          console.error("Error creating storage bucket:", bucketErr);
          toast.error("Failed to create CV storage bucket");
          return;
        }
      }
      
      // Extract the file path from the URL
      const urlObj = new URL(cvUrl);
      const pathSegments = urlObj.pathname.split('/');
      // Format should be /storage/v1/object/public/cvs/[userId]/[fileName]
      const bucketName = 'cvs';
      
      let filePath;
      if (pathSegments.includes('cvs')) {
        const filePathArray = pathSegments.slice(pathSegments.indexOf('cvs') + 1);
        filePath = filePathArray.join('/');
      } else {
        // This is a fallback in case the URL format is different
        const fileNameMatch = cvUrl.match(/\/([^\/]+)$/);
        if (fileNameMatch) {
          const fileName = fileNameMatch[1];
          // Get user ID from auth
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            filePath = `${session.user.id}/${fileName}`;
          } else {
            toast.error("Could not determine file path");
            return;
          }
        } else {
          toast.error("Could not parse CV URL");
          return;
        }
      }
      
      console.log("Attempting to access file:", bucketName, filePath);

      // Try to download the file directly first
      window.open(cvUrl, '_blank');

    } catch (err) {
      console.error("Error opening CV:", err);
      toast.error("Failed to open CV");
    }
  };

  // Get matched skills from application and task requirements
  const getMatchedSkills = (application: JobApplication) => {
    if (!application.business_roles?.skills_required) return [];
    
    // Get user's skills from profile (assuming they're stored somewhere in the application)
    const userSkills = application.userSkills || [];
    
    // Find the intersection of user skills and required skills
    return application.business_roles.skills_required.filter(skill => 
      userSkills.some(userSkill => 
        typeof userSkill === 'string' 
          ? userSkill.toLowerCase() === skill.toLowerCase()
          : userSkill.skill.toLowerCase() === skill.toLowerCase()
      )
    );
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
            <Collapsible 
              key={application.id} 
              open={expandedApplications.has(application.id)}
              onOpenChange={() => toggleApplicationExpanded(application.id)}
              className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors"
            >
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
                    {application.business_roles.skills_required.slice(0, 3).map((skill, index) => {
                      const isMatched = getMatchedSkills(application).includes(skill);
                      return (
                        <Badge 
                          key={index} 
                          variant={isMatched ? "default" : "outline"} 
                          className="text-xs"
                        >
                          {skill} {isMatched && "✓"}
                        </Badge>
                      );
                    })}
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
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    {application.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={isWithdrawing === application.id}
                        onClick={() => handleWithdraw(application.id, application.task_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isWithdrawing === application.id && <span className="ml-2">...</span>}
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
                      {application.business_roles?.skills_required?.slice(0, 2).map((skill, index) => {
                        const isMatched = getMatchedSkills(application).includes(skill);
                        return (
                          <Badge 
                            key={index} 
                            variant={isMatched ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {skill} {isMatched && "✓"}
                          </Badge>
                        );
                      })}
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
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      title="View Message"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  {application.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleWithdraw(application.id, application.task_id)}
                      disabled={isWithdrawing === application.id}
                      title="Withdraw application"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isWithdrawing === application.id && <span className="ml-2">...</span>}
                    </Button>
                  )}
                </div>
              </div>
              
              <CollapsibleContent className="mt-4 border-t pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Application Message:</p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {application.notes || "No message provided"}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
