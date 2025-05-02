import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Ticket } from "@/types/types";
import { TicketStatus } from "./TicketStatus";
import { TicketPriority } from "./TicketPriority";
import { TicketDueDate } from "./TicketDueDate";
import { TicketEstimatedHours } from "./TicketEstimatedHours";
import { TicketCompletion } from "./TicketCompletion";
import { TicketDescription } from "./TicketDescription";
import { toast } from "sonner"; // Assuming you're using the same toast as in ExpandedTicketDetails

interface TicketDetailsTabProps {
  ticket: Ticket;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const TicketDetailsTab: React.FC<TicketDetailsTabProps> = ({
  ticket,
  onTicketAction,
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true
}) => {
  // Local state to immediately reflect changes in the UI
  const [localTicket, setLocalTicket] = useState<Ticket>(ticket);
  const [isUpdating, setIsUpdating] = useState<{
    status: boolean;
    priority: boolean;
    dueDate: boolean;
    estimatedHours: boolean;
    completion: boolean;
    description: boolean;
  }>({
    status: false,
    priority: false,
    dueDate: false,
    estimatedHours: false,
    completion: false,
    description: false
  });

  // Update local state when ticket prop changes
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket]);

  const handleStatusChange = async (value: string) => {
    setIsUpdating(prev => ({ ...prev, status: true }));
    // Update local state immediately for instant feedback
    setLocalTicket(prev => ({ ...prev, status: value }));
    
    try {
      await onTicketAction(ticket.id, "updateStatus", value);
      toast.success("Status updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, status: ticket.status }));
      toast.error("Failed to update status");
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, status: false }));
    }
  };

  const handlePriorityChange = async (value: string) => {
    setIsUpdating(prev => ({ ...prev, priority: true }));
    // Update local state immediately
    setLocalTicket(prev => ({ ...prev, priority: value }));
    
    try {
      await onTicketAction(ticket.id, "updatePriority", value);
      toast.success("Priority updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, priority: ticket.priority }));
      toast.error("Failed to update priority");
      console.error("Error updating priority:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, priority: false }));
    }
  };

  const handleDueDateChange = async (selectedDate: Date | undefined) => {
    setIsUpdating(prev => ({ ...prev, dueDate: true }));
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
    
    // Update local state immediately
    setLocalTicket(prev => ({ ...prev, due_date: formattedDate }));
    
    try {
      await onTicketAction(ticket.id, "updateDueDate", formattedDate);
      toast.success("Due date updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, due_date: ticket.due_date }));
      toast.error("Failed to update due date");
      console.error("Error updating due date:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, dueDate: false }));
    }
  };

  const handleCompletionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIsUpdating(prev => ({ ...prev, completion: true }));
    
    // Update local state immediately
    setLocalTicket(prev => ({ ...prev, completion_percentage: value }));
    
    try {
      await onTicketAction(ticket.id, "updateCompletionPercentage", value);
      toast.success("Completion percentage updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, completion_percentage: ticket.completion_percentage }));
      toast.error("Failed to update completion percentage");
      console.error("Error updating completion percentage:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, completion: false }));
    }
  };

  const handleEstimatedHoursChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setIsUpdating(prev => ({ ...prev, estimatedHours: true }));
    
    // Update local state immediately
    setLocalTicket(prev => ({ ...prev, estimated_hours: value }));
    
    try {
      await onTicketAction(ticket.id, "updateEstimatedHours", value);
      toast.success("Estimated hours updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, estimated_hours: ticket.estimated_hours }));
      toast.error("Failed to update estimated hours");
      console.error("Error updating estimated hours:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, estimatedHours: false }));
    }
  };

  const handleDescriptionChange = async (value: string) => {
    setIsUpdating(prev => ({ ...prev, description: true }));
    
    // Update local state immediately
    setLocalTicket(prev => ({ ...prev, description: value }));
    
    try {
      await onTicketAction(ticket.id, "updateDescription", value);
      toast.success("Description updated successfully");
    } catch (error) {
      // Revert local state on error
      setLocalTicket(prev => ({ ...prev, description: ticket.description }));
      toast.error("Failed to update description");
      console.error("Error updating description:", error);
    } finally {
      setIsUpdating(prev => ({ ...prev, description: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TicketStatus 
          status={localTicket.status} 
          disabled={!userCanEditStatus || isUpdating.status}
          onChange={handleStatusChange}
        />
        <TicketPriority 
          priority={localTicket.priority} 
          disabled={!userCanEditStatus || isUpdating.priority}
          onChange={handlePriorityChange}
        />
        <TicketDueDate 
          date={localTicket.due_date ? new Date(localTicket.due_date) : undefined}
          disabled={!userCanEditDates || isUpdating.dueDate}
          onChange={handleDueDateChange}
        />
        <TicketEstimatedHours 
          hours={localTicket.estimated_hours || 0}
          disabled={!userCanEditDates || isUpdating.estimatedHours}
          onChange={handleEstimatedHoursChange}
        />
        <TicketCompletion 
          percentage={localTicket.completion_percentage || 0}
          disabled={!userCanEditStatus || isUpdating.completion}
          onChange={handleCompletionChange}
        />
      </div>

      <TicketDescription 
        description={localTicket.description} 
        disabled={isUpdating.description}
        onSave={handleDescriptionChange}
      />

      {onLogTime && (
        <div className="pt-4">
          <Button onClick={() => onLogTime(ticket.id)}>
            <Clock className="h-4 w-4 mr-2" /> Log Time
          </Button>
        </div>
      )}
    </div>
  );
};
