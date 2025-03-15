
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { JobApplication } from '@/types/jobSeeker';

export interface ProjectHeaderProps {
  title?: string;
  companyName?: string;
  projectTitle?: string;
  status: string;
  appliedAt: string;
  application?: JobApplication;
  isExpanded?: boolean;
  toggleExpand?: () => void;
}

export const ProjectHeader = ({ 
  title, 
  companyName, 
  projectTitle,
  status,
  appliedAt,
  application,
  isExpanded,
  toggleExpand
}: ProjectHeaderProps) => {
  // If application is provided, extract properties from it
  const displayTitle = title || application?.business_roles?.title || "Untitled Role";
  const displayCompanyName = companyName || application?.business_roles?.company_name || "Unknown company";
  const displayProjectTitle = projectTitle || application?.business_roles?.project_title || "Untitled Project";
  const displayStatus = status || application?.status || "pending";
  const displayAppliedAt = appliedAt || application?.applied_at || "";
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'negotiation':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h3 className="text-md font-semibold line-clamp-1">
          {displayTitle}
        </h3>
        <Badge className={getStatusColor(displayStatus)}>
          {displayStatus}
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center">
          {displayCompanyName}
        </span>
        <span className="inline-flex items-center">
          Project: {displayProjectTitle}
        </span>
        <span className="inline-flex items-center">
          Applied: {formatDate(displayAppliedAt)}
        </span>
      </div>
    </div>
  );
};
