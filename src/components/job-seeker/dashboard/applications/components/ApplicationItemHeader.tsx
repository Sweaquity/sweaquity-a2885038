
import { ApplicationHeader } from '../ApplicationHeader';
import { ApplicationStatus } from './ApplicationStatus';
import { ApplicationSkills } from '../ApplicationSkills';
import { JobApplication } from '@/types/jobSeeker';

interface ApplicationItemHeaderProps {
  application: JobApplication;
  isExpanded: boolean;
  toggleExpand: () => void;
  onStatusChange: (status: string) => void;
  isUpdatingStatus: boolean;
  showAcceptButton: boolean;
  onAcceptClick: () => void;
  isAcceptingJob: boolean;
  compact?: boolean;
}

export const ApplicationItemHeader = ({
  application,
  isExpanded,
  toggleExpand,
  onStatusChange,
  isUpdatingStatus,
  showAcceptButton,
  onAcceptClick,
  isAcceptingJob,
  compact = false
}: ApplicationItemHeaderProps) => {
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        {application.business_roles && (
          <ApplicationHeader 
            title={application.business_roles.title || "Untitled Role"}
            company={application.business_roles.company_name || "Unknown Company"}
            project={application.business_roles.project_title || ""}
            status={application.status}
          />
        )}
        
        <ApplicationStatus 
          isExpanded={isExpanded}
          toggleExpand={toggleExpand}
          status={application.status}
          onStatusChange={onStatusChange}
          isUpdatingStatus={isUpdatingStatus}
          showAcceptButton={showAcceptButton}
          onAcceptClick={onAcceptClick}
          isAcceptingJob={isAcceptingJob}
          compact={compact}
        />
      </div>

      <div className="mt-2">
        {application.business_roles && (
          <ApplicationSkills
            skillRequirements={application.business_roles.skill_requirements || []}
            equityAllocation={application.business_roles.equity_allocation}
            timeframe={application.business_roles.timeframe}
          />
        )}
      </div>
    </div>
  );
};
