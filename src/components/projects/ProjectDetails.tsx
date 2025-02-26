
import { Badge } from "@/components/ui/badge";

interface ProjectDetailsProps {
  description: string;
  timeframe: string;
  equityAllocation: number;
  skillsRequired: string[];
}

export const ProjectDetails = ({
  description,
  timeframe,
  equityAllocation,
  skillsRequired,
}: ProjectDetailsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Project Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Description</dt>
              <dd>{description}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Timeframe</dt>
              <dd>{timeframe}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Equity Available</dt>
              <dd>{equityAllocation}%</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Required Skills</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {skillsRequired.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
