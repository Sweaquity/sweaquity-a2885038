
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SkillRequirement } from '@/types/jobSeeker';

export interface ApplicationSkillsProps {
  skillRequirements: (string | SkillRequirement)[];
  equityAllocation?: number;
  timeframe?: string;
}

export const ApplicationSkills = ({ 
  skillRequirements, 
  equityAllocation,
  timeframe 
}: ApplicationSkillsProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {skillRequirements.slice(0, 3).map((skill, index) => {
          const skillName = typeof skill === 'string' ? skill : skill.skill;
          return (
            <Badge key={index} variant="outline" className="text-xs">
              {skillName}
            </Badge>
          );
        })}
        
        {skillRequirements.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{skillRequirements.length - 3} more
          </span>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        {timeframe && `${timeframe}`}
        {timeframe && equityAllocation && ` • `}
        {equityAllocation !== undefined && `${equityAllocation}% equity`}
      </div>
    </div>
  );
};
