
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobApplication, SkillRequirement } from "@/types/jobSeeker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusBadge } from "./StatusBadge";

interface PastApplicationItemProps {
  application: JobApplication;
  getMatchedSkills: (application: JobApplication) => string[];
}

export const PastApplicationItem = ({ application, getMatchedSkills }: PastApplicationItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const matchedSkills = getMatchedSkills(application);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Unknown date";
    }
  };

  const getReasonText = () => {
    if (application.status.toLowerCase() === "withdrawn") {
      return "You withdrew this application" + (application.notes ? ": " + application.notes : "");
    } else if (application.status.toLowerCase() === "rejected") {
      return "This application was rejected" + (application.notes ? ": " + application.notes : "");
    }
    return "";
  };

  const requiredSkills = application.business_roles?.skill_requirements || [];
  const title = application.business_roles?.title || "Untitled Role";
  const company = application.business_roles?.company_name || "Unknown Company";
  const project = application.business_roles?.project_title || "";
  const description = application.business_roles?.description || "";
  const status = application.status;
  const timeframe = application.business_roles?.timeframe || "";
  const equityAllocation = application.business_roles?.equity_allocation || 0;
  const taskStatus = application.business_roles?.task_status || "";
  const completionPercentage = application.business_roles?.completion_percentage || 0;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-base">{title}</h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {company}
              {project && ` • ${project}`}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Role Description</h4>
                <p className="text-sm text-muted-foreground">{description || "No description provided."}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Application Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status: {status}</p>
                    <p className="text-sm text-muted-foreground">Applied: {formatDate(application.applied_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timeframe: {timeframe}</p>
                    <p className="text-sm text-muted-foreground">Equity: {equityAllocation}%</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Reason</h4>
                <p className="text-sm text-muted-foreground">{getReasonText() || "No reason provided."}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Skills Required</h4>
                <div className="flex flex-wrap gap-1">
                  {requiredSkills.map((skill, index) => {
                    const skillName = typeof skill === 'string' ? skill : skill.skill;
                    const isMatched = matchedSkills.includes(skillName);
                    
                    return (
                      <Badge 
                        key={index} 
                        variant={isMatched ? "default" : "outline"}
                        className={isMatched ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                      >
                        {skillName}
                        {typeof skill !== 'string' && skill.level && 
                          <span className="ml-1 opacity-70">({skill.level})</span>
                        }
                      </Badge>
                    );
                  })}
                  {requiredSkills.length === 0 && (
                    <span className="text-sm text-muted-foreground">No specific skills required</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
