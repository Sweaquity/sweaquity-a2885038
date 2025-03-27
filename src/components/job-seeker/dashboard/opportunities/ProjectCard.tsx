
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EquityProject } from '@/types/jobSeeker';

interface ProjectCardProps {
  project: EquityProject;
  onViewDetails?: (project: EquityProject) => void;
  onApply?: (project: EquityProject) => void;
}

const ProjectCard = ({ project, onViewDetails, onApply }: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Function to safely extract skills from different project formats
  const getSkills = () => {
    const subTaskSkills = project.sub_tasks?.[0]?.skill_requirements;
    const businessRoleSkills = project.business_roles?.skill_requirements;
    
    // Try to normalize the skills array
    let skillsList: string[] = [];
    
    if (Array.isArray(subTaskSkills)) {
      skillsList = subTaskSkills.map(skill => {
        if (typeof skill === 'string') return skill;
        if (typeof skill === 'object' && skill && 'skill' in skill) {
          return typeof skill.skill === 'string' ? skill.skill : '';
        }
        return '';
      }).filter(Boolean);
    } else if (Array.isArray(businessRoleSkills)) {
      skillsList = businessRoleSkills.map(skill => {
        if (typeof skill === 'string') return skill;
        if (typeof skill === 'object' && skill && 'skill' in skill) {
          return typeof skill.skill === 'string' ? skill.skill : '';
        }
        return '';
      }).filter(Boolean);
    }
    
    return skillsList;
  };

  const skills = getSkills();
  const matchPercentage = project.skill_match || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{project.title || 'Untitled Project'}</CardTitle>
            <CardDescription className="mt-1">
              {project.business_roles?.company_name || 'Company Name'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            {matchPercentage}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.sub_tasks?.[0]?.description || project.business_roles?.description || 'No description available'}
            </p>
          </div>
          {skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium">Skills Required</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{skills.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium">Equity</h4>
            <p className="text-sm text-muted-foreground">
              {project.sub_tasks?.[0]?.equity_allocation || project.equity_amount || 'Not specified'}%
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Timeframe</h4>
            <p className="text-sm text-muted-foreground">
              {project.sub_tasks?.[0]?.timeframe || project.time_allocated || 'Not specified'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(project)}>
            View Details
          </Button>
        )}
        {onApply && (
          <Button size="sm" onClick={() => onApply(project)}>
            Apply
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
