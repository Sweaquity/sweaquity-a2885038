
import { Profile, JobApplication, EquityProject } from "@/types/jobSeeker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DashboardContentProps {
  profile?: Profile;
  applications?: JobApplication[];
  equityProjects?: EquityProject[];
  onViewProfile?: () => void;
  onViewApplications?: () => void;
  onViewOpportunities?: () => void;
}

export const DashboardContent = ({
  profile,
  applications = [],
  equityProjects = [],
  onViewProfile = () => {},
  onViewApplications = () => {},
  onViewOpportunities = () => {}
}: DashboardContentProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Your Profile</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Complete your profile to improve your chances of finding the perfect project match.
            </p>
            <Button onClick={onViewProfile}>View Profile</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Your Applications</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You have {applications.length} active application{applications.length === 1 ? '' : 's'}.
            </p>
            <Button onClick={onViewApplications}>View Applications</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Active Projects</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You are currently working on {equityProjects.length} project{equityProjects.length === 1 ? '' : 's'}.
            </p>
            <Button onClick={onViewApplications}>View Projects</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Find Opportunities</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Discover new projects that match your skills and interests.
            </p>
            <Button onClick={onViewOpportunities}>Browse Opportunities</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
