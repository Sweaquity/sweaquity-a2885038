
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/jobSeeker";

interface DashboardHeaderProps {
  profile: Profile;
  onSignOut?: () => void;
}

export const DashboardHeader = ({ profile, onSignOut }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        {/* Removed duplicate title here */}
        {profile?.first_name && (
          <p className="text-muted-foreground">
            Welcome back {profile.first_name}, here is where you can see your profile and exciting projects on the Sweaquity platform
          </p>
        )}
      </div>
      {/* Removed sign out button as it's already in the parent component */}
    </div>
  );
};
