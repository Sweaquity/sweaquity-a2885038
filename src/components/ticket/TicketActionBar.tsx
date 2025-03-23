
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TicketActionBarProps {
  ticketId: string;
  status: string;
  priority: string;
  dueDate?: string;
  hasReporter: boolean;
  onStatusChange: (ticketId: string, newStatus: string) => Promise<void>;
  onPriorityChange: (ticketId: string, newPriority: string) => Promise<void>;
  onDueDateChange: (ticketId: string, newDueDate: string) => Promise<void>;
  onReplyClick: (ticketId: string) => void;
}

export const TicketActionBar: React.FC<TicketActionBarProps> = ({
  ticketId,
  status,
  priority,
  dueDate,
  hasReporter,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onReplyClick
}) => {
  // Ensure we have safe non-empty default values
  const safeStatus = status || "new";
  const safePriority = priority || "medium";
  
  return (
    <div className="border-t pt-4 flex flex-wrap gap-4">
      <div>
        <Label htmlFor={`status-${ticketId}`} className="text-xs block mb-1">Update Status</Label>
        <Select
          defaultValue={safeStatus}
          onValueChange={(value) => onStatusChange(ticketId, value)}
        >
          <SelectTrigger id={`status-${ticketId}`} className="w-[140px]">
            <SelectValue placeholder="Status" />
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
        <Label htmlFor={`priority-${ticketId}`} className="text-xs block mb-1">Update Priority</Label>
        <Select
          defaultValue={safePriority}
          onValueChange={(value) => onPriorityChange(ticketId, value)}
        >
          <SelectTrigger id={`priority-${ticketId}`} className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor={`due-date-${ticketId}`} className="text-xs block mb-1">Set Due Date</Label>
        <Input
          id={`due-date-${ticketId}`}
          type="date"
          className="w-[180px]"
          value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
          onChange={(e) => onDueDateChange(ticketId, e.target.value)}
        />
      </div>
      
      {hasReporter && (
        <div className="ml-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onReplyClick(ticketId)}
          >
            Reply to Reporter
          </Button>
        </div>
      )}
    </div>
  );
};
