
import React from "react";
import { Application } from "@/types/business";
import { ApplicationCard } from "../ApplicationCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody } from "@/components/ui/table";

interface ArchivedApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  onApplicationUpdate: () => void;
  handleStatusChange: (id: string, status: string) => Promise<void>;
}

export const ArchivedApplicationsTable = ({
  applications,
  expandedApplications,
  toggleApplicationExpanded,
  onApplicationUpdate,
  handleStatusChange
}: ArchivedApplicationsTableProps) => {
  if (applications.length === 0) {
    return <div className="text-center p-4">No archived applications found.</div>;
  }

  return (
    <ScrollArea className="w-full max-h-[500px] rounded-md border">
      <Table>
        <TableBody>
          {applications.map((application) => (
            <ApplicationCard
              key={application.job_app_id}
              application={application}
              isExpanded={expandedApplications.has(application.job_app_id)}
              toggleExpand={() => toggleApplicationExpanded(application.job_app_id)}
              openAcceptJobDialog={async () => {}} // Not needed for archived applications
              handleStatusChange={handleStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
