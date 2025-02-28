
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, MessageSquare, ChevronDown } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApplicationSkills } from "./ApplicationSkills";

interface ApplicationItemProps {
  application: JobApplication;
  isExpanded: boolean;
  toggleExpanded: () => void;
  getMatchedSkills: (application: JobApplication) => string[];
  onApplicationUpdated?: () => void;
}

export const ApplicationItem = ({ 
  application, 
  isExpanded, 
  toggleExpanded,
  getMatchedSkills, 
  onApplicationUpdated 
}: ApplicationItemProps) => {
  const { isWithdrawing, handleWithdraw, openCV } = useApplicationActions(onApplicationUpdated);
  const matchedSkills = getMatchedSkills(application);

  return (
    <Collapsible 
      open={isExpanded}
      onOpenChange={toggleExpanded}
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
        
        <ApplicationSkills 
          skills={application.business_roles?.skills_required?.slice(0, 3) || []} 
          matchedSkills={matchedSkills}
          totalSkills={application.business_roles?.skills_required?.length || 0}
          limit={3}
          small
        />
        
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
            <ApplicationSkills 
              skills={application.business_roles?.skills_required?.slice(0, 2) || []} 
              matchedSkills={matchedSkills}
              totalSkills={application.business_roles?.skills_required?.length || 0}
              limit={2}
              small
            />
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
                <p className="text-sm">{application.message || "No message provided"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Task Description:</h4>
                <p className="text-sm">{application.business_roles?.description || "No description available"}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Required Skills:</h4>
            <ApplicationSkills 
              skills={application.business_roles?.skills_required || []} 
              matchedSkills={matchedSkills}
              displayEmpty
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
