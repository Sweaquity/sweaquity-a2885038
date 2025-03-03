
import { CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { JobApplication, Skill } from "@/types/jobSeeker";
import { formatDistanceToNow } from "date-fns";
import { SkillBadge } from "../SkillBadge";

interface ApplicationContentProps {
  application: JobApplication;
  matchedSkills: string[];
}

export const ApplicationContent = ({ application, matchedSkills }: ApplicationContentProps) => {
  const timeAgo = application.applied_at 
    ? formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })
    : 'recently';

  return (
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          Applied {timeAgo}
        </div>
        
        {application.business_roles?.description && (
          <div>
            <h4 className="text-sm font-medium mb-1">Role Description:</h4>
            <p className="text-sm text-muted-foreground">
              {application.business_roles.description}
            </p>
          </div>
        )}
        
        {application.message && (
          <div>
            <h4 className="text-sm font-medium mb-1">Your Application Message:</h4>
            <p className="text-sm text-muted-foreground">
              {application.message}
            </p>
          </div>
        )}
        
        {matchedSkills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Your Matching Skills:</h4>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skillName, index) => {
                // Create a Skill object to pass to SkillBadge
                const skill: Skill = {
                  skill: skillName,
                  level: 'Intermediate'
                };
                return (
                  <SkillBadge 
                    key={index} 
                    skill={skill} 
                    isUserSkill={true} 
                  />
                );
              })}
            </div>
          </div>
        )}
        
        {application.notes && application.status.toLowerCase() === 'withdrawn' && (
          <div>
            <h4 className="text-sm font-medium mb-1">Withdrawal Reason:</h4>
            <p className="text-sm text-muted-foreground">
              {application.notes}
            </p>
          </div>
        )}
      </div>
    </CardContent>
  );
};
