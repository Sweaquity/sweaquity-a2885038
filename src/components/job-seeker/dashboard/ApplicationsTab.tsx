
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, ChevronDown, MessageSquare, ArrowLeft } from "lucide-react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [userSkills, setUserSkills] = useState<Skill[]>([]);

  // Fetch user skills when component mounts
  useEffect(() => {
    const fetchUserSkills = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('skills')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data?.skills) {
          let parsedSkills: Skill[] = [];
          
          if (typeof data.skills === 'string') {
            try {
              parsedSkills = JSON.parse(data.skills);
            } catch (e) {
              console.error("Error parsing skills:", e);
            }
          } else if (Array.isArray(data.skills)) {
            parsedSkills = data.skills.map(skill => 
              typeof skill === 'string' ? { skill, level: 'Intermediate' } : skill
            );
          }
          
          setUserSkills(parsedSkills);
        }
      } catch (error) {
        console.error("Error fetching user skills:", error);
      }
    };
    
    fetchUserSkills();
  }, []);

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
      
      // Direct update using the SQL API approach
      const { data, error } = await supabase
        .rpc('withdraw_application', { 
          app_id: applicationId,
          task_id_param: taskId 
        });
      
      if (error) {
        console.error("RPC error:", error);
        
        // Fallback to regular update if RPC fails
        console.log("Falling back to regular update method");
        
        const { error: updateError } = await supabase
          .from('job_applications')
          .update({ status: 'withdrawn' })
          .eq('job_app_id', applicationId);
          
        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
        
        // Update task regardless
        await supabase
          .from('project_sub_tasks')
          .update({ 
            status: 'open',
            task_status: 'open'
          })
          .eq('task_id', taskId);
      }
      
      toast.success("Application withdrawn successfully");
      
      // Call the callback function to refresh the applications list
      if (onApplicationUpdated) {
        onApplicationUpdated();
      }

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
      
      // Simply open the CV URL directly in a new tab
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error("Error opening CV:", err);
      toast.error("Failed to open CV");
    }
  };

  // Get matched skills from application and task requirements
  const getMatchedSkills = (application: JobApplication): string[] => {
    if (!application.business_roles?.skills_required) return [];
    
    // Get user skills from the state
    const skillNames = userSkills.map(skill => skill.skill.toLowerCase());
    
    // Find the intersection of user skills and required skills
    return application.business_roles.skills_required.filter(skill => 
      skillNames.includes(skill.toLowerCase())
    );
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Projects that you've applied for</h2>
        <p className="text-muted-foreground text-sm">View and manage your applications</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.length === 0 && (
            <p className="text-muted-foreground">No applications found.</p>
          )}
          
          {applications.map(application => (
            <Collapsible 
              key={application.job_app_id} 
              open={expandedApplications.has(application.job_app_id)}
              onOpenChange={() => toggleApplicationExpanded(application.job_app_id)}
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
                        className="text-destructive hover:bg-destructive hover:text-white"
                        disabled={isWithdrawing === application.job_app_id}
                        onClick={() => handleWithdraw(application.job_app_id, application.task_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isWithdrawing === application.job_app_id && <span className="ml-2">...</span>}
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
                      className="text-destructive hover:bg-destructive hover:text-white"
                      onClick={() => handleWithdraw(application.job_app_id, application.task_id)}
                      disabled={isWithdrawing === application.job_app_id}
                      title="Withdraw application"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isWithdrawing === application.job_app_id && <span className="ml-2">...</span>}
                    </Button>
                  )}
                </div>
              </div>
              
              <CollapsibleContent className="mt-4 border-t pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Application Details</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="mb-3 pb-3 border-b">
                        <h4 className="text-sm font-medium mb-1">Message:</h4>
                        <p className="text-sm">{application.message || application.notes || "No message provided"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Task Description:</h4>
                        <p className="text-sm">{application.business_roles?.description || "No description available"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Skills:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {application.business_roles?.skills_required?.map((skill, index) => {
                        const isMatched = getMatchedSkills(application).includes(skill);
                        return (
                          <Badge 
                            key={index} 
                            variant={isMatched ? "default" : "secondary"}
                          >
                            {skill} {isMatched && "✓"}
                          </Badge>
                        );
                      })}
                      {(!application.business_roles?.skills_required || application.business_roles.skills_required.length === 0) && (
                        <p className="text-sm text-muted-foreground">No skills specified for this task</p>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
