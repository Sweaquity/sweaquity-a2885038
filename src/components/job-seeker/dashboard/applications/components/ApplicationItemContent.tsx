
import { ApplicationContent } from '../ApplicationContent';
import { MessageActions } from './MessageActions';
import { JobApplication } from '@/types/jobSeeker';

interface ApplicationItemContentProps {
  application: JobApplication;
  onMessageClick: () => void;
  onWithdrawClick: () => void;
}

export const ApplicationItemContent = ({ 
  application,
  onMessageClick,
  onWithdrawClick
}: ApplicationItemContentProps) => {
  return (
    <div className="border-t p-4">
      {application.business_roles && (
        <ApplicationContent 
          description={application.business_roles.description || ""}
          message={application.message || ""}
          discourse={application.task_discourse}
          appliedAt={application.applied_at}
        />
      )}

      <MessageActions 
        onMessageClick={onMessageClick}
        projectId={application.project_id}
        onWithdrawClick={onWithdrawClick}
      />
    </div>
  );
};
