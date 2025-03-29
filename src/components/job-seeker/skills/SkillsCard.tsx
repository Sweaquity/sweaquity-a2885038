import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skill } from "@/types/jobSeeker";

interface SkillsCardProps {
  skills: Skill[] | string[];
  maxSkills?: number;
  viewAll?: boolean;
  onEdit?: () => void;
  onViewAllSkills?: () => void;
  title?: string;
}

export const SkillsCard = ({ skills, maxSkills = 4, viewAll = false, onEdit, title = "Skills" }: SkillsCardProps) => {
  const displayedSkills = viewAll ? skills : skills.slice(0, maxSkills);
  const hasMoreSkills = !viewAll && skills.length > maxSkills;
  
  const getSkillText = (skill: any) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') {
      return skill.skill || skill.name || '';
    }
    return '';
  };
  
  const getSkillLevel = (skill: any) => {
    if (typeof skill === 'object' && skill !== null) {
      return skill.level || '';
    }
    return '';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No skills added yet</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {displayedSkills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="px-2 py-1 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100"
                >
                  {getSkillText(skill)} {getSkillLevel(skill) && `(${getSkillLevel(skill)})`}
                </Badge>
              ))}
            </div>
            
            {hasMoreSkills && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-muted-foreground"
                onClick={() => onViewAllSkills && onViewAllSkills()}
              >
                +{skills.length - maxSkills} more
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
