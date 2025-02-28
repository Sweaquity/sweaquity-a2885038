
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EquityProject } from "@/types/jobSeeker";

interface ProjectsOverviewProps {
  currentProjects?: EquityProject[];
  pastProjects?: EquityProject[];
  onDocumentAction?: (projectId: string, action: 'edit' | 'approve') => void;
}

export const ProjectsOverview = ({
  currentProjects = [],
  pastProjects = [],
  onDocumentAction = () => {}
}: ProjectsOverviewProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Your current equity projects and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Status: {project.status}</p>
                  <p className="text-sm">Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Hours logged: {project.total_hours_logged}</p>
                  {project.documents?.contract && (
                    <div className="flex space-x-2 mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Preview Contract
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <iframe 
                            src={project.documents.contract.url} 
                            className="w-full h-full"
                            title="Contract Preview"
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'edit')}
                      >
                        Edit Contract
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentAction(project.id, 'approve')}
                      >
                        Approve Contract
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {currentProjects.length === 0 && (
              <p className="text-muted-foreground">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Projects</CardTitle>
          <CardDescription>Completed equity projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastProjects.map((project) => (
              <div key={project.id} className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">Final Equity: {project.equity_amount}%</p>
                  <p className="text-sm">Total Hours: {project.total_hours_logged}</p>
                  <p className="text-sm">
                    Duration: {new Date(project.start_date).toLocaleDateString()} - {
                      project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'
                    }
                  </p>
                </div>
              </div>
            ))}
            {pastProjects.length === 0 && (
              <p className="text-muted-foreground">No past projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
