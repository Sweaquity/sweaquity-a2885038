import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, CheckCircle } from 'lucide-react';
import { Skill } from "@/types/jobSeeker";

interface ProjectCardProps {
  project: any;
  onViewDetails: () => void;
  onApply?: () => void;
  skills?: Skill[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onViewDetails, onApply, skills }) => {
  const matchedSkills = skills ? project.skill_requirements?.filter(skill =>
    skills.some(userSkill =>
      (typeof skill === 'string' ? skill.toLowerCase() : skill).includes(userSkill.skill.toLowerCase())
    )
  ) : [];

  const skillMatchPercentage = skills && project.skill_requirements
    ? Math.round((matchedSkills.length / project.skill_requirements.length) * 100)
    : 0;

  return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold line-clamp-1">{project.project_title || project.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 space-y-2">
        <p className="line-clamp-3">{project.description}</p>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{project.timeframe}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span>{project.business_roles_count || 0} Open Roles</span>
        </div>
        {project.equity_allocation && (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span>{project.equity_allocation}% Equity</span>
          </div>
        )}
        {skills && (
          <div className="flex items-center space-x-2">
            <span>Skill Match:</span>
            <Badge variant="secondary">{skillMatchPercentage}%</Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4">
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
        {onApply && (
          <Button size="sm" onClick={onApply}>
            Apply Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
