
import React from "react";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TicketTableHeaderProps {
  showTimeTracking: boolean;
}

export const TicketTableHeader: React.FC<TicketTableHeaderProps> = ({ 
  showTimeTracking 
}) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Priority</TableHead>
        <TableHead>Type</TableHead>
        {showTimeTracking && <TableHead>Hours</TableHead>}
        <TableHead>Due Date</TableHead>
        <TableHead>Completion</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
