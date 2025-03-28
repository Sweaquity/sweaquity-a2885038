
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { JobApplication } from '@/types/jobSeeker';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

export interface PendingApplicationItemProps {
  application: JobApplication;
  onAccept?: (application: JobApplication) => Promise<void>;
  onWithdraw?: (applicationId: string, reason?: string) => Promise<void>;
  isWithdrawing?: boolean;
  getMatchedSkills: () => string[];
}

export const PendingApplicationItem = ({
  application,
  onAccept,
  onWithdraw,
  isWithdrawing = false,
  getMatchedSkills
}: PendingApplicationItemProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const applicationId = application.job_app_id || application.id || '';
  const needsAcceptance = application.status === 'accepted' && application.accepted_business && !application.accepted_jobseeker;
  const matchedSkills = getMatchedSkills();
  
  const handleAccept = async () => {
    if (!onAccept) return;
    
    try {
      setIsAccepting(true);
      await onAccept(application);
    } catch (error) {
      console.error("Error accepting application:", error);
    } finally {
      setIsAccepting(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    
    try {
      await onWithdraw(applicationId);
    } catch (error) {
      console.error("Error withdrawing application:", error);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium">{application.task_title || "Untitled Task"}</h3>
            <p className="text-sm text-muted-foreground">
              {application.company_name || 'Company'} • {application.project_title || 'Project'}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied {formatDate(application.applied_at)}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {needsAcceptance && (
              <Button 
                onClick={handleAccept} 
                disabled={isAccepting}
                size="sm"
              >
                {isAccepting ? 'Accepting...' : 'Accept Job'}
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={handleWithdraw} 
              disabled={isWithdrawing}
              size="sm"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setIsExpanded(!isExpanded)}
              size="sm"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-3">
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
            
            {application.message && (
              <div>
                <h4 className="text-sm font-medium mb-1">Your Message:</h4>
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
      </div>
    </Card>
  );
};
