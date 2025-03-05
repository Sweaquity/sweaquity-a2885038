
import { Button } from "@/components/ui/button";
import { Building2, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardHeader } from "./DashboardHeader";
import { Profile } from "@/types/jobSeeker";

interface DashboardHeaderWithActionsProps {
  profile: Profile | null;
  hasBusinessProfile: boolean;
  onProfileSwitch: () => void;
  onSignOut: () => void;
}

export const DashboardHeaderWithActions = ({
  profile,
  hasBusinessProfile,
  onProfileSwitch,
  onSignOut,
}: DashboardHeaderWithActionsProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl md:text-2xl font-bold">
        Job Seeker Dashboard
      </h1>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-4">
          {hasBusinessProfile && (
            <Button variant="outline" onClick={onProfileSwitch}>
              <Building2 className="mr-2 h-4 w-4" />
              Switch to Business
            </Button>
          )}
          <Button variant="outline" onClick={onSignOut}>Sign Out</Button>
        </div>
        
        <div className="flex md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasBusinessProfile && (
                <DropdownMenuItem onClick={onProfileSwitch}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Switch to Business
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
