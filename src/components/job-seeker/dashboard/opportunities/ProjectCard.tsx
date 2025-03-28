import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, Clock, Users, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ProjectCardProps {
  project: any;
  userSkills: string[];
  onApply: (projectId: string) => void;
  isApplying: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  userSkills,
  onApply,
  isApplying
}) => {
  const [expanded, setExpanded] = useState(false);
  const [skillMatch, setSkillMatch] = useState(0);
  const router = useRouter();

  useEffect(() => {
    calculateSkillMatch();
  }, [project, userSkills]);

  const calculateSkillMatch = () => {
    if (!userSkills || userSkills.length === 0 || !project.skills_required || project.skills_required.length === 0) {
      setSkillMatch(0);
      return;
    }

    const matchingSkills = userSkills.filter(userSkill => {
      if (!project.skills_required || project.skills_required.length === 0) {
        return false;
      }
      
      return project.skills_required.some(requiredSkill => {
        if (typeof requiredSkill === 'string') {
          return requiredSkill.toLowerCase().includes(userSkill.toLowerCase());
        } else if (typeof requiredSkill === 'object' && requiredSkill.skill) {
          return requiredSkill.skill.toLowerCase().includes(userSkill.toLowerCase());
        }
        return false;
      });
    });

    const matchPercentage = Math.round((matchingSkills.length / project.skills_required.length) * 100);
    setSkillMatch(matchPercentage > 100 ? 100 : matchPercentage);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleApply = () => {
    onApply(project.id);
  };

  const handleViewDetails = () => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <div className="text-sm text-muted-foreground">{project.company_name}</div>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant="outline" className="mb-1">
              {skillMatch}% Match
            </Badge>
            <div className="text-xs text-muted-foreground">
              Posted {formatDate(project.created_at)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {project.skills_required && project.skills_required.map((skill: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {typeof skill === 'string' ? skill : skill.skill}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.equity_amount || 0}% Equity</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.timeframe || 'Flexible'}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.estimated_hours || 'Not specified'} hours</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{project.applicants_count || 0} applicants</span>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96' : 'max-h-16'}`}>
          <p className="text-sm text-muted-foreground mb-4">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs flex items-center"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Show More
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="text-xs"
            >
              View Details
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying}
              className="text-xs"
            >
              Apply Now <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
