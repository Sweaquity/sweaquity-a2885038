
import React from 'react';
import { StatusBadge } from '../StatusBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SkillMatch {
  skill: string;
  match: boolean;
  required: boolean;
}

export interface ApplicationItemHeaderProps {
  title: string;
  project: string;
  company: string;
  status: string;
  matchedSkills?: SkillMatch[];
  compensation?: string;
  equity?: string;
}

export const ApplicationItemHeader = ({ 
  title, 
  project, 
  company, 
  status,
  matchedSkills,
  compensation,
  equity
}: ApplicationItemHeaderProps) => {
  const hasSkills = matchedSkills && matchedSkills.length > 0;
  const matchCount = matchedSkills?.filter(s => s.match).length || 0;
  const totalSkills = matchedSkills?.length || 0;
  const matchPercentage = totalSkills > 0 ? Math.round((matchCount / totalSkills) * 100) : 0;
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {company} {project && `• ${project}`}
          </p>
        </div>
        
        <div className="flex items-start space-x-2">
          {hasSkills && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={matchPercentage >= 80 ? "success" : matchPercentage >= 50 ? "outline" : "default"}
                    className={cn(
                      "cursor-help",
                      matchPercentage >= 80 ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                      matchPercentage >= 50 ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                      "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    )}
                  >
                    {matchCount}/{totalSkills} Skills
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Skill Match Details</p>
                    <ul className="text-xs space-y-1">
                      {matchedSkills.map((skill, i) => (
                        <li key={i} className="flex items-center">
                          <span className={skill.match ? "text-green-500" : "text-gray-500"}>
                            {skill.match ? "✓" : "✗"}
                          </span>
                          <span className="ml-1">
                            {skill.skill} {skill.required && "(Required)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <StatusBadge status={status} />
        </div>
      </div>
      
      {(compensation || equity) && (
        <div className="flex space-x-4 text-sm">
          {compensation && (
            <div>
              <span className="text-muted-foreground">Compensation:</span>{" "}
              <span className="font-medium">{compensation}</span>
            </div>
          )}
          {equity && (
            <div>
              <span className="text-muted-foreground">Equity:</span>{" "}
              <span className="font-medium">{equity}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
