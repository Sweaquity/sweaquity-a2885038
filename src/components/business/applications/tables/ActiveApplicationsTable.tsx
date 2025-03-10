import React, { useState } from "react";
import { Application } from "@/types/business";
import { AcceptJobDialog } from "../AcceptJobDialog";
import { ApplicationCard } from "../ApplicationCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody } from "@/components/ui/table";

interface ActiveApplicationsTableProps {
  applications: Application[];
  expandedApplications: Set<string>;  // Added expandedApplications prop
  toggleApplicationExpanded: (id: string) => void; // Added toggle function prop
  onApplicationUpdate: () => void;
  handleStatusChange: (id: string, status: string) => Promise<void>;
  openAcceptJobDialog: (application: Application) => Promise<void>; // Ensuring the correct type
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

  return (
    <ScrollArea className="w-full max-h-[500px] rounded-md border">
      <Table>
        <TableBody>
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              isExpanded={expandedApplications.has(application.id)} // Use Set for tracking expansion
              toggleExpand={() => toggleApplicationExpanded(application.id)} // Use the provided function
              openAcceptJobDialog={(app) => openAcceptJobDialog(app).catch(console.error)} // Ensuring Promise<void>
              handleStatusChange={handleStatusChange}
            />
          ))}
        </TableBody>
      </Table>
      
      {selectedApplication && (
        <AcceptJobDialog
          open={acceptJobDialogOpen}
          onOpenChange={setAcceptJobDialogOpen}
          application={selectedApplication}
          onAccept={onApplicationUpdate}
        />
      )}
    </ScrollArea>
  );
};

