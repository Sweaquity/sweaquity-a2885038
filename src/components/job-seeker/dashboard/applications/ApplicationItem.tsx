
import { useState } from "react";
import { JobApplication, SkillRequirement } from "@/types/jobSeeker";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApplicationActions } from "./hooks/useApplicationActions";
import { Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ApplicationSkills } from "./ApplicationSkills";

interface ApplicationItemProps {
  application: JobApplication;
  isExpanded: boolean;
  toggleExpanded: () => void;
  getMatchedSkills?: (application: JobApplication) => string[];
  onApplicationUpdated?: () => void;
}

export const ApplicationItem = ({
  application,
  isExpanded,
  toggleExpanded,
  getMatchedSkills,
  onApplicationUpdated,
}: ApplicationItemProps) => {
  const { isWithdrawing, handleWithdraw, openCV } = useApplicationActions(onApplicationUpdated);
  
  // Format the date in a human-readable format
  const formattedDate = application.applied_at
    ? formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })
    : "Unknown date";

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-gray-50"
        onClick={toggleExpanded}
      >
        <TableCell>
          <div className="font-medium">{application.business_roles?.title || "Unknown Role"}</div>
        </TableCell>
        <TableCell>{application.business_roles?.company_name || "Unknown Company"}</TableCell>
        <TableCell>{application.business_roles?.timeframe || "N/A"}</TableCell>
        <TableCell>{application.business_roles?.equity_allocation || 0}%</TableCell>
        <TableCell>
          <Badge
            className={
              application.status === "accepted"
                ? "bg-green-100 text-green-800"
                : application.status === "rejected" || application.status === "withdrawn"
                ? "bg-red-100 text-red-800"
                : application.status === "in review" || application.status === "negotiation"
                ? "bg-blue-100 text-blue-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            {application.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">{formattedDate}</TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0 border-t-0">
            <div className="p-4 bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{application.business_roles?.title}</h3>
                  <p className="text-sm text-gray-600">
                    {application.business_roles?.company_name} • {application.business_roles?.project_title}
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-sm">{application.business_roles?.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-1">Timeframe</h4>
                      <p className="text-sm">{application.business_roles?.timeframe || "Not specified"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Equity</h4>
                      <p className="text-sm">{application.business_roles?.equity_allocation || 0}%</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Your Application</h4>
                  <p className="text-sm">
                    Status: <Badge>{application.status}</Badge>
                  </p>
                  <p className="text-sm mt-2">Applied: {formattedDate}</p>
                  
                  {application.message && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-1">Your Message</h4>
                      <p className="text-sm bg-white p-3 rounded border">{application.message}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    {application.cv_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCV(application.cv_url || "");
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View CV
                      </Button>
                    )}
                    
                    {application.status !== "withdrawn" && application.status !== "rejected" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isWithdrawing === application.job_app_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWithdraw(application.job_app_id);
                        }}
                      >
                        {isWithdrawing === application.job_app_id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          "Withdraw Application"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Required Skills</h4>
                {application.business_roles?.skill_requirements && application.business_roles.skill_requirements.length > 0 ? (
                  <ApplicationSkills
                    requiredSkills={
                      application.business_roles.skill_requirements.map(req => {
                        if (typeof req === 'string') {
                          return req;
                        }
                        // Ensure we're only passing valid SkillRequirement values
                        return {
                          skill: req.skill,
                          level: (req.level === 'Beginner' || req.level === 'Intermediate' || req.level === 'Expert') 
                            ? req.level 
                            : 'Intermediate' 
                        } as SkillRequirement;
                      })
                    }
                    matchedSkills={getMatchedSkills ? getMatchedSkills(application) : []}
                  />
                ) : (
                  <p className="text-sm text-gray-500">No specific skills required</p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
