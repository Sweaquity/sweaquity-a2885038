
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EquityProject } from "@/types/jobSeeker";

interface OpportunitiesTabProps {
  projects: EquityProject[];
}

export const OpportunitiesTab = ({ projects }: OpportunitiesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Matched Skills Projects</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="border p-4 rounded-lg hover:bg-secondary/50 transition-colors">
              <a href={`/projects/${project.id}`} className="block">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">Company/Project</p>
                    <p>{project.business_roles?.title}</p>
                  </div>
                  <div>
                    <p className="font-medium">Timeframe</p>
                    <p>{project.time_allocated}</p>
                  </div>
                  <div>
                    <p className="font-medium">Equity Available</p>
                    <p>{project.equity_amount}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Project Value</p>
                    <p>TBD</p>
                  </div>
                </div>
              </a>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-muted-foreground">No matching opportunities found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
