
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MoreHorizontal } from "lucide-react";
import { JobApplication } from "@/types/jobSeeker";
import { StatusBadge } from "./StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ApplicationHeaderProps {
  application: JobApplication;
  onWithdrawClick: () => void;
}

export const ApplicationHeader = ({ application, onWithdrawClick }: ApplicationHeaderProps) => {
  return (
    <CardHeader className="border-b bg-muted/30 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">
            {application.business_roles?.title || "Untitled Role"}
          </CardTitle>
          <CardDescription className="flex items-center mt-1">
            <Briefcase className="h-4 w-4 mr-1" />
            {application.business_roles?.company_name || "Unknown Company"}
            {application.business_roles?.project_title && (
              <span className="ml-2">• {application.business_roles.project_title}</span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={application.status} />
          
          {['pending', 'in review'].includes(application.status.toLowerCase()) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onWithdrawClick}>
                  Withdraw Application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </CardHeader>
  );
};
