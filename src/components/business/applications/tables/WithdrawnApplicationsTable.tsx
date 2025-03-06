
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Application } from "@/types/business";

interface WithdrawnApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  handleStatusChange: (id: string, status: string) => void;
  isUpdatingStatus: string | null;
}

export const WithdrawnApplicationsTable = ({ 
  applications, 
  expandedApplications, 
  toggleApplicationExpanded, 
  handleStatusChange, 
  isUpdatingStatus 
}: WithdrawnApplicationsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Applicant</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-center">Date Withdrawn</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map(application => (
          <TableRow 
            key={application.job_app_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleApplicationExpanded(application.job_app_id)}
          >
            <TableCell>
              <div>
                <p className="font-medium">{application.profile?.first_name} {application.profile?.last_name}</p>
                <p className="text-xs text-muted-foreground">{application.profile?.title || "No title"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{application.business_roles?.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {application.business_roles?.project?.title && `Project: ${application.business_roles.project.title}`}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <p className="text-sm">{new Date(application.updated_at || application.applied_at).toLocaleDateString()}</p>
            </TableCell>
            <TableCell>
              {expandedApplications.has(application.job_app_id) ? 
                <ChevronDown className="h-4 w-4 mx-auto" /> : 
                <ChevronRight className="h-4 w-4 mx-auto" />
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {applications.map(application => (
        <Collapsible
          key={`${application.job_app_id}-details`}
          open={expandedApplications.has(application.job_app_id)}
        >
          <CollapsibleContent className="p-4 border-t">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h4 className="font-medium mb-2">Withdrawal Notes</h4>
                <p className="text-sm">{application.notes || "No notes provided"}</p>
              </div>
              
              {application.task_discourse && (
                <div>
                  <h4 className="font-medium mb-2">Communication History</h4>
                  <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
                    <div className="space-y-2 text-xs">
                      {application.task_discourse.split('\n\n').map((msg, i) => (
                        <div key={i} className="p-2 rounded-md bg-gray-100 border-gray-200 border">
                          {msg}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </Table>
  );
};
