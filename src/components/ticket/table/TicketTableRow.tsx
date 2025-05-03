
import React from "react";
import { Ticket } from "@/types/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import { formatDate } from "../utils/dateFormatters";

interface TicketTableRowProps {
  ticket: Ticket;
  showTimeTracking: boolean;
  userCanEditStatus: boolean;
  openTicketDetails: (ticket: Ticket) => void;
  handleUpdateStatus: (ticketId: string, status: string) => void;
  handleUpdatePriority: (ticketId: string, priority: string) => void;
  showDeleteConfirmation: (ticket: Ticket) => void;
  onLogTime?: (ticketId: string) => void;
  renderTicketActions?: (ticket: Ticket) => React.ReactNode;
}

export const TicketTableRow: React.FC<TicketTableRowProps> = ({
  ticket,
  showTimeTracking,
  userCanEditStatus,
  openTicketDetails,
  handleUpdateStatus,
  handleUpdatePriority,
  showDeleteConfirmation,
  onLogTime,
  renderTicketActions
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <span className="h-4 w-4 mr-1 text-blue-500">🔵</span>;
      case "in-progress":
        return <span className="h-4 w-4 mr-1 text-yellow-500">🟡</span>;
      case "blocked":
        return <span className="h-4 w-4 mr-1 text-red-500">🔴</span>;
      case "done":
      case "closed":
        return <span className="h-4 w-4 mr-1 text-green-500">✅</span>;
      default:
        return <span className="h-4 w-4 mr-1 text-gray-500">⚪</span>;
    }
  };

  const getTicketTypeLabel = (type: string) => {
    switch (type) {
      case "task":
        return "Task";
      case "ticket":
        return "Ticket";
      case "beta_testing":
      case "beta-test":
      case "beta-testing":
        return "Beta Test";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <TableRow key={ticket.id}>
      <TableCell
        className="font-medium cursor-pointer hover:text-blue-600"
        onClick={() => openTicketDetails(ticket)}
      >
        {ticket.title}
      </TableCell>
      <TableCell>
        <Select
          value={ticket.status}
          onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
          disabled={!userCanEditStatus}
        >
          <SelectTrigger className={`w-[130px] ${getStatusColor(ticket.status)}`}>
            <SelectValue>
              <div className="flex items-center">
                {getStatusIcon(ticket.status)}
                <span>
                  {ticket.status === "in-progress"
                    ? "In Progress"
                    : ticket.status.charAt(0).toUpperCase() +
                      ticket.status.slice(1)}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={ticket.priority}
          onValueChange={(value) => handleUpdatePriority(ticket.id, value)}
        >
          <SelectTrigger className={`w-[100px] ${getPriorityColor(ticket.priority)}`}>
            <SelectValue>
              {ticket.priority.charAt(0).toUpperCase() +
                ticket.priority.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {getTicketTypeLabel(ticket.type || "task")}
        </Badge>
      </TableCell>
      {showTimeTracking && (
        <TableCell>
          {ticket.hours_logged || 0} / {ticket.estimated_hours || 0} hrs
        </TableCell>
      )}
      <TableCell>{formatDate(ticket.due_date)}</TableCell>
      <TableCell>{ticket.completion_percentage || 0}%</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTicketDetails(ticket)}
          >
            View
          </Button>
          {showTimeTracking && onLogTime && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLogTime(ticket.id)}
            >
              Log Time
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 hover:bg-red-50"
            onClick={() => showDeleteConfirmation(ticket)}
          >
            <Trash className="h-4 w-4" />
          </Button>
          {renderTicketActions && renderTicketActions(ticket)}
        </div>
      </TableCell>
    </TableRow>
  );
};
