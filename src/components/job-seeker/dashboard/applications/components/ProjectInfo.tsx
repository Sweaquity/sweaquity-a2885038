
import { Badge } from '@/components/ui/badge';

interface ProjectInfoProps {
  taskStatus?: string;
  timeframe?: string;
  equityAllocation?: number;
  skillRequirements?: (string | { skill: string; level?: string })[] | null;
}

export const ProjectInfo = ({ 
  taskStatus, 
  timeframe, 
  equityAllocation = 0,
  skillRequirements = []
}: ProjectInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-2 text-sm">
        <div>
          <p className="text-muted-foreground">Skills Required</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {skillRequirements && Array.isArray(skillRequirements) && skillRequirements.length > 0 ? (
              skillRequirements.map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-slate-50">
                  {typeof skill === 'string' ? skill : skill.skill}
                  {typeof skill !== 'string' && skill.level && 
                    <span className="ml-1 opacity-70">({skill.level})</span>
                  }
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">No specific skills required</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
