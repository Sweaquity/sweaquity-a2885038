
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Loader2, MessageCircle, Bell, CheckCircle, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Application } from "@/types/business";
import { JobApplication, SkillRequirement } from "@/types/jobSeeker";

interface ActiveApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  handleStatusChange: (id: string, status: string) => void;
  isUpdatingStatus: string | null;
  openAcceptJobDialog: (application: Application) => void;
  handleAcceptJob: (application: JobApplication) => Promise<void>;
  isAcceptingJobLoading: boolean;
}

export const ActiveApplicationsTable = ({ 
  applications, 
  expandedApplications, 
  toggleApplicationExpanded, 
  handleStatusChange, 
  isUpdatingStatus,
  openAcceptJobDialog,
  handleAcceptJob,
  isAcceptingJobLoading
}: ActiveApplicationsTableProps) => {
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSendMessage = async (applicationId: string) => {
    if (!message.trim()) return;
    
    try {
      setSendingMessage(applicationId);
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select('task_discourse')
        .eq('job_app_id', applicationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const timestamp = new Date().toLocaleString();
      const newMessage = `[${timestamp}] Business: ${message}`;
      
      const updatedDiscourse = application.task_discourse 
        ? `${application.task_discourse}\n\n${newMessage}`
        : newMessage;
        
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ task_discourse: updatedDiscourse })
        .eq('job_app_id', applicationId);
        
      if (updateError) throw updateError;
      
      setMessage("");
      toast.success("Message sent successfully");
      
      const { data: updatedApplication, error: refreshError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_app_id', applicationId)
        .single();
      
      if (!refreshError) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(null);
    }
  };

  const toggleExpand = (applicationId: string) => {
    if (expandedId === applicationId) {
      setExpandedId(null);
    } else {
      setExpandedId(applicationId);
    }
  };

  return (
    <div className="space-y-4">
      {applications.map(application => (
        <Card key={application.job_app_id} className="shadow-sm hover:shadow transition-shadow">
          <Collapsible 
            open={expandedId === application.job_app_id}
            onOpenChange={() => toggleExpand(application.job_app_id)}
          >
            <CardHeader className="p-4 pb-3 flex flex-col space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Applicant:</span>
                  <span>{application.profile?.first_name} {application.profile?.last_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Role:</span>
                  <span>{application.business_roles?.title || "Untitled Role"}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Description:</span>
                  <span className="truncate">{application.business_roles?.description || "No description"}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Equity:</span>
                  <span>{application.business_roles?.equity_allocation ? `${application.business_roles.equity_allocation}%` : "N/A"}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Status:</span>
                  <Badge className={
                    application.status.toLowerCase() === 'accepted' 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }>
                    {application.status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Jobseeker Accepted:</span>
                  <span>{application.accepted_jobseeker ? "Yes" : "No"}</span>
                </div>
              </div>
              
              <div className="flex flex-col mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Skills Required:</span>
                  <div className="flex flex-wrap gap-1">
                    {application.business_roles?.skill_requirements?.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-slate-50">
                        {typeof skill === 'string' ? skill : skill.skill}
                        {typeof skill !== 'string' && skill.level && 
                          <span className="ml-1 opacity-70">({skill.level})</span>
                        }
                      </Badge>
                    ))}
                    {(!application.business_roles?.skill_requirements || 
                      application.business_roles.skill_requirements.length === 0) && 
                      <span className="text-muted-foreground">No specific skills required</span>
                    }
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Timeframe:</span>
                  <span>{application.business_roles?.timeframe || "Not specified"}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    {expandedId === application.job_app_id ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                {application.status === 'accepted' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAcceptJobDialog(application);
                          }}
                          disabled={application.accepted_business}
                        >
                          {application.accepted_business ? (
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <Bell className="h-4 w-4 mr-1" />
                          )}
                          {application.accepted_business ? "Accepted" : "Accept Contract"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {application.accepted_business 
                          ? "You have accepted this job contract" 
                          : "Accept job contract and finalize equity agreement"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="px-4 pb-4 space-y-4">
                {application.message && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Application Message:</h4>
                    <div className="bg-muted/30 p-3 rounded-md text-sm">
                      {application.message}
                    </div>
                  </div>
                )}
                
                {application.cv_url && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">CV:</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-sm"
                      asChild
                    >
                      <a href={application.cv_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" />
                        View CV
                      </a>
                    </Button>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-semibold mb-1">Communication History:</h4>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
                    {application.task_discourse ? (
                      <div className="space-y-2 text-xs">
                        {application.task_discourse.split('\n\n').map((msg, i) => {
                          const isBusinessMsg = msg.includes('Business:');
                          return (
                            <div 
                              key={i} 
                              className={`p-2 rounded-md ${
                                isBusinessMsg 
                                  ? 'bg-blue-50 border-blue-200 border ml-4' 
                                  : 'bg-gray-100 border-gray-200 border mr-4'
                              }`}
                            >
                              {msg}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No messages yet</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Textarea 
                      placeholder="Type a message..." 
                      className="text-sm resize-none h-10 py-2"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(application.job_app_id);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleSendMessage(application.job_app_id)} 
                      disabled={sendingMessage === application.job_app_id || !message.trim()}
                    >
                      {sendingMessage === application.job_app_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};
