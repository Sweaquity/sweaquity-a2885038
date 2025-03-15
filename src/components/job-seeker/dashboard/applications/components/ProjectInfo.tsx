
import { Badge } from '@/components/ui/badge';
import { JobApplication } from '@/types/jobSeeker';

export interface ProjectInfoProps {
  taskStatus?: string;
  timeframe?: string;
  equityAllocation?: number;
  skillRequirements?: (string | { skill: string; level?: string })[];
  title?: string;
  description?: string;
  projectTitle?: string;
  companyName?: string;
}

export const ProjectInfo = ({ 
  taskStatus, 
  timeframe, 
  equityAllocation,
  skillRequirements = [],
  title,
  description,
  projectTitle,
  companyName
}: ProjectInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 text-sm">
        <div>
          <p className="text-muted-foreground">Task Status</p>
          <p>{taskStatus || "Pending"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Timeframe</p>
          <p>{timeframe || "Not specified"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Equity Allocation</p>
          <p>{equityAllocation}%</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mb-2 text-sm">
        <div>
          <p className="text-muted-foreground">Skills Required</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {skillRequirements.map((skill, index) => (
              <Badge key={index} variant="outline" className="bg-slate-50">
                {typeof skill === 'string' ? skill : skill.skill}
                {typeof skill !== 'string' && skill.level && 
                  <span className="ml-1 opacity-70">({skill.level})</span>
                }
              </Badge>
            ))}
            {(!skillRequirements || skillRequirements.length === 0) && 
              <span className="text-muted-foreground">No specific skills required</span>
            }
          </div>
        </div>
      </div>
    </>
  );
};
