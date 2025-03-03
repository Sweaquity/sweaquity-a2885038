
import { useState } from "react";
import { JobApplication } from "@/types/jobSeeker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, FilePdf } from "lucide-react";
import { WithdrawDialog } from "./WithdrawDialog";
import { CreateMessageDialog } from "./CreateMessageDialog";

interface ApplicationContentProps {
  application: JobApplication;
  onWithdrawSuccess?: () => void;
  onMessageSent?: () => void;
}

export const ApplicationContent = ({ 
  application, 
  onWithdrawSuccess,
  onMessageSent
}: ApplicationContentProps) => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const viewCv = () => {
    if (application.cv_url) {
      window.open(application.cv_url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Project description section */}
      {application.business_roles?.description && (
        <div>
          <h4 className="font-medium mb-1">Project Description</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {application.business_roles.description}
          </p>
        </div>
      )}
      
      {/* Application message section */}
      {application.message && (
        <div>
          <h4 className="font-medium mb-1">Your Application Message</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {application.message}
          </p>
        </div>
      )}

      {/* Message history section */}
      {application.task_discourse && (
        <div className="p-3 bg-slate-50 rounded-md border">
          <h4 className="font-medium mb-2">Message History</h4>
          <pre className="text-sm whitespace-pre-wrap font-sans">
            {application.task_discourse}
          </pre>
        </div>
      )}
      
      {/* Skills section */}
      {application.business_roles?.skill_requirements && 
      application.business_roles.skill_requirements.length > 0 && (
        <div>
          <h4 className="font-medium mb-1">Required Skills</h4>
          <div className="flex flex-wrap gap-1">
            {application.business_roles.skill_requirements.map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-slate-50">
                {typeof skill === 'string' ? skill : skill.skill}
                {typeof skill !== 'string' && skill.level && 
                  <span className="ml-1 opacity-70">({skill.level})</span>
                }
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions section */}
      <div className="flex flex-wrap gap-2 mt-4">
        {['pending', 'in review', 'negotiation'].includes(application.status.toLowerCase()) && (
          <>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setIsMessageDialogOpen(true)}
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Send Message
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm"
              onClick={viewCv}
              disabled={!application.cv_url}
            >
              <FilePdf className="mr-1.5 h-4 w-4" />
              View CV
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsWithdrawDialogOpen(true)}
            >
              Withdraw Application
            </Button>
          </>
        )}
      </div>
      
      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        applicationId={application.job_app_id}
        onWithdrawSuccess={onWithdrawSuccess}
      />
      
      <CreateMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        applicationId={application.job_app_id}
        onMessageSent={onMessageSent}
      />
    </div>
  );
};
