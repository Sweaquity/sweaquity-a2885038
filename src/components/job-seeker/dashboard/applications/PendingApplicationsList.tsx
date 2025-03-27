
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PendingApplicationsListProps } from '@/types/types';

export const PendingApplicationsList: React.FC<PendingApplicationsListProps> = ({
  applications,
  onWithdraw,
  onAccept,
  isWithdrawing = false,
  getMatchedSkills
}) => {
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);

  const toggleApplicationExpansion = (applicationId: string) => {
    setExpandedApplicationId(prevId => prevId === applicationId ? null : applicationId);
  };

  // Default implementation if getMatchedSkills is not provided
  const defaultGetMatchedSkills = () => {
    return {
      matched: [],
      total: 0,
      matchPercentage: 0
    };
  };

  // Use the provided getMatchedSkills function or fall back to the default
  const calculateMatchedSkills = getMatchedSkills || defaultGetMatchedSkills;

  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending applications found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Applications ({applications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((application) => {
            // Safely calculate matched skills without TypeScript errors
            const matchResult = calculateMatchedSkills(application);
            const matchedSkillsArray = matchResult.matched || [];
            const totalSkills = matchResult.total || 0;
            const matchPercentage = matchResult.matchPercentage || 0;
            
            return (
              <div key={application.job_app_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {application.business_roles?.title || 'Task Title'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {application.business_roles?.company_name || 'Company'} | 
                      {application.business_roles?.project_title || 'Project'}
                    </p>
                    {matchedSkillsArray.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Matched Skills: {matchedSkillsArray.length}/{totalSkills} ({matchPercentage}%)
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {matchedSkillsArray.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onAccept && (
                      <Button
                        size="sm"
                        onClick={() => onAccept(application)}
                      >
                        Accept
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleApplicationExpansion(application.job_app_id)}
                    >
                      {expandedApplicationId === application.job_app_id ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
                
                {expandedApplicationId === application.job_app_id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-3">
                      {application.business_roles?.description && (
                        <div>
                          <h4 className="text-sm font-medium">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {application.business_roles.description}
                          </p>
                        </div>
                      )}
                      
                      {application.message && (
                        <div>
                          <h4 className="text-sm font-medium">Applicant Message</h4>
                          <p className="text-sm italic text-muted-foreground">
                            {application.message}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        {onWithdraw && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onWithdraw(application.job_app_id)}
                            disabled={isWithdrawing}
                          >
                            {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
