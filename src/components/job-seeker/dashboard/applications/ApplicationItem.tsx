
import { Card } from "@/components/ui/card";
import { JobApplication } from "@/types/jobSeeker";
import { ApplicationHeader } from "./ApplicationHeader";
import { ApplicationContent } from "./ApplicationContent";
import { WithdrawDialog } from "./WithdrawDialog";
import { useWithdrawApplication } from "./hooks/useWithdrawApplication";

interface ApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: () => string[];
  onApplicationUpdated?: () => void;
}

export const ApplicationItem = ({ 
  application, 
  getMatchedSkills,
  onApplicationUpdated 
}: ApplicationItemProps) => {
  const {
    isWithdrawDialogOpen,
    setIsWithdrawDialogOpen,
    isWithdrawing,
    handleWithdrawApplication
  } = useWithdrawApplication(onApplicationUpdated);

  const matchedSkills = getMatchedSkills();

  const onWithdraw = async (reason: string) => {
    await handleWithdrawApplication(application.job_app_id, reason);
  };

  return (
    <Card className="overflow-hidden">
      <ApplicationHeader 
        application={application} 
        onWithdrawClick={() => setIsWithdrawDialogOpen(true)} 
      />
      
      <ApplicationContent 
        application={application} 
        matchedSkills={matchedSkills}
        onWithdrawSuccess={onApplicationUpdated}
      />

      <WithdrawDialog
        isOpen={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        onWithdraw={onWithdraw}
        isWithdrawing={isWithdrawing}
      />
    </Card>
  );
};
