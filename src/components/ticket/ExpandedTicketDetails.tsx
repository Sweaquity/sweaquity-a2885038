import { useState } from "react";
import { format } from 'date-fns';
import { CalendarIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ExpandedTicketDetailsProps {
  ticket: any;
  userId: string;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
}

export const ExpandedTicketDetails = ({
  ticket,
  userId,
  onTicketAction,
}: ExpandedTicketDetailsProps) => {
  const [note, setNote] = useState("");

  const handleStatusChange = async (status: string) => {
    await onTicketAction(ticket.id, 'updateStatus', status);
  };

  const handlePriorityChange = async (priority: string) => {
    await onTicketAction(ticket.id, 'updatePriority', priority);
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    if (date) {
      await onTicketAction(ticket.id, 'updateDueDate', date.toISOString());
    }
  };

  const handleAddNote = async () => {
    if (note.trim()) {
      await onTicketAction(ticket.id, 'addNote', note);
      setNote("");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-lg font-semibold">{ticket.title}</h3>
        <p className="text-muted-foreground">{ticket.description}</p>
        {ticket.task_url && (
          <a href={ticket.task_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-500 hover:underline">
            View Task <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {ticket.due_date ? format(new Date(ticket.due_date), 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={ticket.due_date ? new Date(ticket.due_date) : undefined}
                onSelect={handleDueDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={ticket.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Estimated Hours</Label>
          <p>{ticket.estimated_hours || 'Not set'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Notes</Label>
        {ticket.notes && ticket.notes.length > 0 ? (
          <ul className="list-disc pl-5">
            {ticket.notes.map((note: any) => (
              <li key={note.id} className="mb-2">
                <div className="font-semibold">{note.user}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(note.timestamp), 'PPP p')}</div>
                <div>{note.comment}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No notes yet.</p>
        )}
        <Textarea
          placeholder="Add a note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button size="sm" onClick={handleAddNote} disabled={!note.trim()}>Add Note</Button>
      </div>
    </div>
  );
};
