
import React, { useState } from "react";
import { Ticket } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { TicketAttachment } from "./TicketAttachment";

export interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onClose,
  onTicketAction,
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true
}) => {
  const [newNote, setNewNote] = useState("");

  const handleStatusChange = async (value: string) => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, "updateStatus", value);
    }
  };

  const handlePriorityChange = async (value: string) => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, "updatePriority", value);
    }
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTicketAction) {
      await onTicketAction(ticket.id, "updateDueDate", e.target.value);
    }
  };

  const handleAddNote = async () => {
    if (onTicketAction && newNote.trim()) {
      await onTicketAction(ticket.id, "addNote", newNote);
      setNewNote("");
    }
  };

  const formatDate = (date: string | undefined | null) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "blocked":
        return <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />;
      case "done":
      case "closed":
        return <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 mr-1 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{ticket.title}</h2>
          <p className="text-muted-foreground">{ticket.description}</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={ticket.status}
            onValueChange={handleStatusChange}
            disabled={!userCanEditStatus}
          >
            <SelectTrigger className="mt-1">
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
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select
            value={ticket.priority}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Due Date</Label>
          <Input
            type="date"
            className="mt-1"
            value={ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : ''}
            onChange={handleDueDateChange}
            disabled={!userCanEditDates}
          />
        </div>
      </div>

      {/* Show ticket attachments if this is a beta testing ticket */}
      {(ticket.ticket_type === 'beta_testing' || ticket.attachments) && ticket.attachments && ticket.attachments.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <TicketAttachment attachments={ticket.attachments} />
        </div>
      )}

      {ticket.notes && ticket.notes.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Notes</h3>
          <div className="space-y-3">
            {ticket.notes.map((note, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{note.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.timestamp)}
                  </span>
                </div>
                <p>{note.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Add Note</h3>
        <div className="flex gap-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1"
          />
          <Button onClick={handleAddNote}>Add</Button>
        </div>
      </div>

      {onLogTime && (
        <div className="border-t pt-4">
          <Button onClick={() => onLogTime(ticket.id)}>Log Time</Button>
        </div>
      )}
    </div>
  );
};
