
import React, { useState } from "react";
import { Application } from "@/types/business";
import { AcceptJobDialog } from "../AcceptJobDialog";
import { ApplicationCard } from "../ApplicationCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody } from "@/components/ui/table";

interface ActiveApplicationsTableProps {
  applications: Application[];
  onApplicationUpdate: () => void;
  handleStatusChange: (id: string, status: string) => Promise<void>;
}

export const ActiveApplicationsTable = ({
  applications,
  onApplicationUpdate,
  handleStatusChange
}: ActiveApplicationsTableProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptJobDialogOpen, setAcceptJobDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openAcceptJobDialog = (application: Application) => {
    setSelectedApplication(application);
    setAcceptJobDialogOpen(true);
  };

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
              isExpanded={expandedId === application.id}
              toggleExpand={() => toggleExpand(application.id)}
              openAcceptJobDialog={openAcceptJobDialog}
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
