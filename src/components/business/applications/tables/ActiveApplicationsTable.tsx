
import React, { useState } from "react";
import { Application } from "@/types/business";
import { AcceptJobDialog } from "../AcceptJobDialog";
import { ApplicationCard } from "../ApplicationCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody } from "@/components/ui/table";

interface ActiveApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;
  toggleApplicationExpanded: (id: string) => void;
  onApplicationUpdate: () => Promise<void>; // Update to return Promise
  handleStatusChange: (id: string, status: string) => Promise<void>;
  openAcceptJobDialog: (application: Application) => Promise<void>;
}

export const ActiveApplicationsTable = ({
  applications,
  expandedApplications,
  toggleApplicationExpanded,
  onApplicationUpdate,
  handleStatusChange,
  openAcceptJobDialog
}: ActiveApplicationsTableProps) => {
  const [acceptJobDialogOpen, setAcceptJobDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  if (applications.length === 0) {
    return <div className="text-center p-4">No active applications found.</div>;
  }

  // Create a wrapper function that matches the expected type
  const handleOpenAcceptJobDialog = async (application: Application) => {
    await openAcceptJobDialog(application);
  };

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
              openAcceptJobDialog={handleOpenAcceptJobDialog}
              handleStatusChange={handleStatusChange}
            />
          ))}
        </TableBody>
      </Table>
      
      {selectedApplication && (
        <AcceptJobDialog
          isOpen={acceptJobDialogOpen}
          onOpenChange={setAcceptJobDialogOpen}
          application={selectedApplication}
          onAccept={onApplicationUpdate}
        />
      )}
    </ScrollArea>
  );
};
