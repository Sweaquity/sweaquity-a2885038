
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, MapPin, Users2, Briefcase } from "lucide-react";

interface BusinessDetailsProps {
  businessDetails: {
    company_name: string;
    created_at: string;
    business_type: string;
    industry: string;
    location: string;
    organization_type: string;
  };
  projectDetails: {
    title: string;
    description: string;
    project_stage: string;
    equity_allocation: number;
    skills_required: string[];
    completion_percentage: number;
    equity_allocated: number;
    created_at: string;
  };
  userSkills: Array<{
    skill: string;
    level: string;
  }>;
}

export const BusinessDetails = ({ 
  businessDetails, 
  projectDetails,
  userSkills
}: BusinessDetailsProps) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{projectDetails.title}</h2>
        <Badge>{businessDetails.business_type}</Badge>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>{businessDetails.industry}</span>
        <Separator orientation="vertical" className="h-4" />
        <MapPin className="w-4 h-4" />
        <span>{businessDetails.location}</span>
        <Separator orientation="vertical" className="h-4" />
        <Users2 className="w-4 h-4" />
        <span>{businessDetails.company_name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h4 className="font-medium mb-2">Project Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created: {format(new Date(projectDetails.created_at), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Stage: {projectDetails.project_stage}</span>
            </div>
            <p className="text-sm mt-2">{projectDetails.description}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Equity Details</h4>
          <div className="space-y-2">
            <div>Total Allocation: {projectDetails.equity_allocation}%</div>
            <div>Allocated: {projectDetails.equity_allocated}%</div>
            <div>Project Completion: {projectDetails.completion_percentage}%</div>
          </div>
          <div className="mt-3">
            <h4 className="font-medium mb-1">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {projectDetails.skills_required?.map((skill, index) => {
                const isMatch = userSkills.some(us => us.skill.toLowerCase() === skill.toLowerCase());
                return (
                  <Badge 
                    key={index} 
                    variant={isMatch ? "default" : "secondary"}
                  >
                    {skill}
                    {isMatch && " ✓"}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
