
import React from "react";
import { Application } from "@/types/business";
import { ApplicationCard } from "../ApplicationCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody } from "@/components/ui/table";

interface ArchivedApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  onApplicationUpdate: () => Promise<void>;
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

  // Empty function for openAcceptJobDialog since it's not needed for archived applications
  const dummyOpenAcceptJobDialog = async () => {};

  return (
    <ScrollArea className="w-full max-h-[500px] rounded-md border">
      <Table>
        <TableBody>
          {applications.map((application) => (
            <ApplicationCard
              key={application.id || application.job_app_id}
              application={application}
              isExpanded={expandedApplications.has(application.id || application.job_app_id)}
              toggleExpand={() => toggleApplicationExpanded(application.id || application.job_app_id)}
              openAcceptJobDialog={dummyOpenAcceptJobDialog}
              handleStatusChange={handleStatusChange}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
