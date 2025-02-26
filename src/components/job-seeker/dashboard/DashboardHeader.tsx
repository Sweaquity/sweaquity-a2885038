
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/jobSeeker";

interface DashboardHeaderProps {
  profile: Profile;
  onSignOut: () => void;
}

export const DashboardHeader = ({ profile, onSignOut }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
        {profile?.first_name && (
          <p className="text-muted-foreground">
            Welcome back {profile.first_name}, here is where you can see your profile and exciting projects on the Sweaquity platform
          </p>
        )}
      </div>
      <Button variant="outline" onClick={onSignOut}>Sign Out</Button>
    </div>
  );
};
