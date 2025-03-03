
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MoreHorizontal } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ApplicationHeaderProps {
  title: string;
  company: string;
  project: string;
  status: string;
  onWithdrawClick?: () => void;
  application?: any; // Keep for backward compatibility
}

export const ApplicationHeader = ({ 
  title, 
  company, 
  project,
  status,
  onWithdrawClick,
  application 
}: ApplicationHeaderProps) => {
  return (
    <CardHeader className="border-b bg-muted/30 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">
            {title || "Untitled Role"}
          </CardTitle>
          <CardDescription className="flex items-center mt-1">
            <Briefcase className="h-4 w-4 mr-1" />
            {company || "Unknown Company"}
            {project && (
              <span className="ml-2">• {project}</span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          
          {onWithdrawClick && ['pending', 'in review'].includes(status.toLowerCase()) && (
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
