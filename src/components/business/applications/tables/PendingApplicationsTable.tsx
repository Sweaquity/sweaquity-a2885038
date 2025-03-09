
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Application } from "@/types/business";
import { previewApplicationCV } from "@/utils/setupStorage";

interface PendingApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  handleStatusChange: (id: string, status: string) => void;
  isUpdatingStatus: string | null;
}

export const PendingApplicationsTable = ({ 
  applications, 
  expandedApplications, 
  toggleApplicationExpanded, 
  handleStatusChange, 
  isUpdatingStatus 
}: PendingApplicationsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Applicant</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-center">Skills Match</TableHead>
          <TableHead className="text-center w-[150px]">Status</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map(application => (
          <TableRow 
            key={application.job_app_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleApplicationExpanded(application.job_app_id)}
          >
            <TableCell>
              <div>
                <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                <p className="text-xs text-muted-foreground">{application.profile?.title || "No title"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{application.business_roles?.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {application.business_roles?.timeframe && `${application.business_roles.timeframe} • `}
                  {application.business_roles?.equity_allocation && `${application.business_roles.equity_allocation}% equity`}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={
                application.skillMatch && application.skillMatch > 70 ? "default" :
                application.skillMatch && application.skillMatch > 40 ? "secondary" : 
                "outline"
              }>
                {application.skillMatch || 0}% match
              </Badge>
            </TableCell>
            <TableCell>
              <div className="w-full flex justify-center">
                <select 
                  className="w-full px-2 py-1 border rounded text-sm bg-white"
                  value={application.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(application.job_app_id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isUpdatingStatus === application.job_app_id}
                >
                  <option value="pending">Pending</option>
                  <option value="in review">In Review</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
                {isUpdatingStatus === application.job_app_id && (
                  <Loader2 className="animate-spin ml-2 h-4 w-4" />
                )}
              </div>
            </TableCell>
            <TableCell>
              {expandedApplications.has(application.job_app_id) ? 
                <ChevronDown className="h-4 w-4 mx-auto" /> : 
                <ChevronRight className="h-4 w-4 mx-auto" />
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {applications.map(application => (
        <Collapsible
          key={`${application.job_app_id}-details`}
          open={expandedApplications.has(application.job_app_id)}
        >
          <CollapsibleContent className="p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Application Details</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Message</p>
                    <p className="text-sm">{application.message || "No message provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Applied</p>
                    <p className="text-sm">{new Date(application.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm">{application.profile?.location || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preference</p>
                    <p className="text-sm">{application.profile?.employment_preference || "Not specified"}</p>
                  </div>
                  {application.cv_url && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewApplicationCV(application.cv_url!);
                        }}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Download Application CV
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Skills Match</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Required Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {application.business_roles?.skill_requirements?.map((skillReq, index) => {
                        const hasSkill = application.profile?.skills?.some(
                          s => typeof s === 'object' && s !== null && 'skill' in s && 
                            typeof s.skill === 'string' && 
                            typeof skillReq === 'object' && skillReq !== null && 'skill' in skillReq &&
                            typeof skillReq.skill === 'string' &&
                            s.skill.toLowerCase() === skillReq.skill.toLowerCase()
                        );
                        return (
                          <Badge key={index} variant={hasSkill ? "default" : "outline"} className="text-xs">
                            {typeof skillReq === 'object' ? skillReq.skill : skillReq} 
                            {typeof skillReq === 'object' && (
                              <span>({skillReq.level})</span>
                            )} 
                            {hasSkill && "✓"}
                          </Badge>
                        );
                      })}
                      
                      {(!application.business_roles?.skill_requirements || application.business_roles.skill_requirements.length === 0) && 
                        <p className="text-xs text-muted-foreground">No skill requirements specified</p>
                      }
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm mt-1">{application.business_roles?.description || "No description provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Timeframe</p>
                    <p className="text-sm">{application.business_roles?.timeframe || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Equity Allocation</p>
                    <p className="text-sm">{application.business_roles?.equity_allocation ? `${application.business_roles.equity_allocation}%` : "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </Table>
  );
};
