
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, Target, Users, Lightbulb, Eye } from 'lucide-react';
import { EquityProject } from '@/types/jobSeeker';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: EquityProject;
  userSkills: string[];
  onApplyClick: (projectId: string) => void;
}

export const ProjectCard = ({ project, userSkills, onApplyClick }: ProjectCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  const handleApply = () => {
    onApplyClick(project.project_id);
  };
  
  const handleViewProject = () => {
    navigate(`/projects/${project.project_id}`);
  };

  // Get matched skills
  const matchedSkills = userSkills.filter(skill => {
    const projectSkills = project.skills_required || [];
    return projectSkills.some(ps => {
      if (typeof ps === 'string') {
        return ps.toLowerCase() === skill.toLowerCase();
      }
      return ps.skill.toLowerCase() === skill.toLowerCase();
    });
  });

  const hasMatchingSkills = matchedSkills.length > 0;

  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {project.title}
              {project.status === 'featured' && (
                <Badge className="ml-2" variant="secondary">Featured</Badge>
              )}
              {hasMatchingSkills && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Skills Match
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {project.company_name || 'Company'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={toggleExpanded}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="mb-4">
          <p className="text-sm line-clamp-2">
            {project.description || 'No description provided'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Equity: {project.equity_allocation || 0}%</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.timeframe || 'Flexible'}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1">
                {project.skills_required && project.skills_required.length > 0 ? (
                  project.skills_required.map((skill, index) => {
                    const skillName = typeof skill === 'string' ? skill : skill.skill;
                    const isMatched = matchedSkills.includes(skillName);
                    
                    return (
                      <Badge 
                        key={index}
                        variant={isMatched ? "default" : "outline"}
                        className={isMatched ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {skillName}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground text-sm">No specific skills required</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Project Details</h3>
              <p className="text-sm whitespace-pre-wrap">
                {project.description || 'No detailed description available.'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewProject}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Project
              </Button>
              
              <Button 
                onClick={handleApply}
                size="sm"
              >
                Apply Now
              </Button>
            </div>
          </div>
        )}

        {!expanded && (
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>
                {project.updated_at ? formatTimeAgo(project.updated_at) : 'Recently posted'}
              </span>
            </div>
            <Button 
              onClick={handleApply}
              size="sm"
            >
              Apply Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
