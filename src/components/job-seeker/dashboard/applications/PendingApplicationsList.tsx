
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, Lightbulb } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useUserSkills } from "./hooks/useUserSkills";

interface PendingApplicationsListProps {
  applications: JobApplication[];
  onWithdraw: (applicationId: string, reason?: string) => Promise<void>;
  onAccept: (application: JobApplication) => Promise<void>;
  isWithdrawing: boolean;
}

export const PendingApplicationsList = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing
}: PendingApplicationsListProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isAccepting, setIsAccepting] = useState<Set<string>>(new Set());
  const { userSkills, getMatchedSkills } = useUserSkills();

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAccept = async (application: JobApplication) => {
    const applicationId = application.job_app_id || '';
    try {
      setIsAccepting(prev => new Set(prev).add(applicationId));
      await onAccept(application);
    } finally {
      setIsAccepting(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    await onWithdraw(applicationId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "Recently";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Recently";
    }
  };

  const getMatchedSkillsForApplication = (application: JobApplication) => {
    const taskSkills = Array.isArray(application.business_roles?.skill_requirements) 
      ? application.business_roles?.skill_requirements
      : [];
      
    // Extract skill names from task requirements safely
    const requiredSkillNames = taskSkills.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (typeof skill === 'object' && skill !== null) {
        if ('skill' in skill && typeof skill.skill === 'string') return skill.skill.toLowerCase();
        if ('name' in skill && typeof skill.name === 'string') return skill.name.toLowerCase();
      }
      return '';
    }).filter(Boolean); // Filter out empty strings
    
    // Get user skill names safely
    const userSkillNames = userSkills.map(skill => {
      if (typeof skill === 'string') return skill.toLowerCase();
      if (typeof skill === 'object' && skill !== null) {
        if ('skill' in skill && typeof skill.skill === 'string') return skill.skill.toLowerCase();
        if ('name' in skill && typeof skill.name === 'string') return skill.name.toLowerCase();
      }
      return '';
    }).filter(Boolean); // Filter out empty strings
    
    // Find matching skills
    return requiredSkillNames.filter(skill => 
      userSkillNames.includes(skill)
    );
  };

  if (!applications.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">No pending applications found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {applications.map(application => {
        const applicationId = application.job_app_id || '';
        const needsAcceptance = application.status === 'accepted' && application.accepted_business && !application.accepted_jobseeker;
        const matchedSkills = getMatchedSkillsForApplication(application);
        
        return (
          <Card key={applicationId} className="mb-4 overflow-hidden">
            <div className="border-b cursor-pointer" onClick={() => toggleExpand(applicationId)}>
              <div className="flex flex-col md:flex-row justify-between p-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-lg flex items-center font-medium">
                        {application.business_roles?.title || "Untitled Role"}
                        {needsAcceptance && (
                          <Badge className="ml-2 bg-blue-500" variant="secondary">
                            Ready to Accept
                          </Badge>
                        )}
                        {!needsAcceptance && (
                          <Badge className="ml-2 bg-yellow-500" variant="secondary">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {application.business_roles?.company_name || 'Company'} | Project: {application.business_roles?.project_title || 'Project'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Applied: {getTimeAgo(application.applied_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <div className="text-xs font-medium">Status</div>
                      <div className="text-sm">{needsAcceptance ? 'Ready to Accept' : 'Pending'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Application Date</div>
                      <div className="text-sm">{formatDate(application.applied_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Skills Match</div>
                      <div className="text-sm">{matchedSkills.length} skills</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex mt-4 md:mt-0 justify-between items-center space-x-2">
                  {needsAcceptance && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(application);
                      }}
                      disabled={isAccepting.has(applicationId)}
                    >
                      {isAccepting.has(applicationId) ? 'Accepting...' : 'Accept Job'}
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWithdraw(applicationId);
                    }}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(applicationId);
                    }}
                  >
                    {expandedItems.has(applicationId) ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </div>
            </div>
            
            {expandedItems.has(applicationId) && (
              <div className="p-4 space-y-4">
                {matchedSkills.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                    <div>
                      <span className="text-sm font-medium">Matched Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {matchedSkills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-1">Role Description</h4>
                  <p className="text-sm text-muted-foreground">{application.business_roles?.description || "No description provided."}</p>
                </div>
                
                {application.message && (
                  <div>
                    <h4 className="font-medium mb-1">Your Message:</h4>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded-md">
                      {application.message}
                    </p>
                  </div>
                )}
                
                {needsAcceptance && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Business has accepted your application!</strong> You can now accept this job to start working on it.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
