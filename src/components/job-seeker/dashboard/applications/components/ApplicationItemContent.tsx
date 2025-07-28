// 🎯 ENHANCED ApplicationItemContent.tsx
// File location: src/components/job-seeker/dashboard/applications/components/ApplicationItemContent.tsx
// Drop-in replacement that adds workflow status indicators
// Maintains your existing design while adding workflow awareness

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Eye,
  ExternalLink
} from "lucide-react";

// Use your existing JobApplication type
interface JobApplication {
  job_app_id: string;
  user_id: string;
  project_id: string;
  task_id?: string;
  status: string;
  nda_document_id?: string;
  nda_status?: string;
  message?: string;
  applied_at?: string;
  business_roles?: {
    project?: {
      title: string;
      business?: {
        company_name: string;
      };
    };
    task_status?: string;
  };
}

interface ApplicationItemContentProps {
  application: JobApplication;
  onViewDetails?: () => void;
  className?: string;
}

// 🔧 Workflow Status Badge Component
const WorkflowStatusBadge = ({ application }: { application: JobApplication }) => {
  const { status, nda_status } = application;
  
  // Determine workflow stage and status
  if (status === 'negotiation' || status === 'pending') {
    if (nda_status === 'executed_by_jobseeker') {
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          NDA Signed
        </Badge>
      );
    } else if (nda_status === 'pending_jobseeker_review') {
      return (
        <Badge variant="destructive" className="text-xs animate-pulse">
          <AlertCircle className="h-3 w-3 mr-1" />
          NDA Review Required
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          NDA Pending
        </Badge>
      );
    }
  }
  
  if (status === 'accepted') {
    // For accepted applications, we'd need to check contract status
    // This would require additional data fetching or props
    return (
      <Badge variant="default" className="text-xs">
        <FileText className="h-3 w-3 mr-1" />
        Contract Setup
      </Badge>
    );
  }
  
  // Default status badge for other states
  return (
    <Badge variant="secondary" className="text-xs">
      {status}
    </Badge>
  );
};

// 🎯 Action Required Indicator
const ActionRequiredIndicator = ({ application }: { application: JobApplication }) => {
  const needsNDAReview = application.nda_status === 'pending_jobseeker_review';
  const isAccepted = application.status === 'accepted';
  
  if (needsNDAReview) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-700 font-medium">Action Required: NDA Review</span>
      </div>
    );
  }
  
  if (isAccepted) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-xs text-green-700 font-medium">Accepted: Complete Setup</span>
      </div>
    );
  }
  
  return null;
};

// 🎨 MAIN COMPONENT - Enhanced ApplicationItemContent
export const ApplicationItemContent = ({ 
  application, 
  onViewDetails,
  className = ""
}: ApplicationItemContentProps) => {
  const hasWorkflow = ['negotiation', 'pending', 'accepted'].includes(application.status);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with Project Info and Status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">
            {application.business_roles?.project?.title || 'Project Application'}
          </h4>
          <p className="text-xs text-gray-500">
            {application.business_roles?.project?.business?.company_name || 'Unknown Business'}
          </p>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          {/* Original status display */}
          <div className="text-sm">{application.status}</div>
          
          {/* Enhanced workflow status badge */}
          {hasWorkflow && <WorkflowStatusBadge application={application} />}
        </div>
      </div>

      {/* Action Required Section */}
      {hasWorkflow && <ActionRequiredIndicator application={application} />}

      {/* Application Message */}
      {application.message && (
        <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Message:</strong> {application.message.length > 100 
            ? `${application.message.substring(0, 100)}...` 
            : application.message
          }
        </div>
      )}

      {/* Application Details */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          {application.applied_at && (
            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
          )}
          {application.business_roles?.task_status && (
            <span className="ml-2">Task: {application.business_roles.task_status}</span>
          )}
        </div>
        
        {/* View Details Button */}
        {onViewDetails && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="h-6 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            {hasWorkflow ? 'Manage Workflow' : 'View Details'}
          </Button>
        )}
      </div>

      {/* Workflow Progress Indicator */}
      {hasWorkflow && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs">
            <div className={`flex items-center space-x-1 ${
              ['negotiation', 'pending', 'accepted'].includes(application.status) 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`}>
              <Shield className="h-3 w-3" />
              <span>NDA</span>
              {application.nda_status === 'executed_by_jobseeker' && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
            
            {application.status === 'accepted' && (
              <>
                <div className="w-4 h-px bg-gray-300" />
                <div className="flex items-center space-x-1 text-blue-600">
                  <FileText className="h-3 w-3" />
                  <span>Contract</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};