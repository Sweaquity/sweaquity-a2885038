
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Ticket } from "@/types/types";
import { formatDateTime } from "../utils/dateFormatters";
import { showRefreshNotification, RefreshType, showRefreshError } from "../utils/refreshNotification";

interface TicketActivityTabProps {
  ticket: Ticket;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
  onDataChanged?: () => void; // Add callback for parent notification
  refreshTrigger?: number; // New prop to force re-renders
}

export const TicketActivityTab: React.FC<TicketActivityTabProps> = ({
  ticket,
  onTicketAction,
  onDataChanged,
  refreshTrigger = 0
}) => {
  const [activityComment, setActivityComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddActivityComment = async () => {
    if (!activityComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await onTicketAction(ticket.id, "addComment", activityComment);
      setActivityComment("");
      
      // Show success notification
      showRefreshNotification(RefreshType.ACTIVITY);
      
      // Notify parent component about the data change
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      showRefreshError(RefreshType.ACTIVITY, error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle key press (Enter) to submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddActivityComment();
    }
  };

  return (
    <div className="space-y-4" key={`activity-${ticket.id}-${refreshTrigger}`}>
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500">
          The activity log shows all actions taken on this ticket.
        </p>
      </div>
      
      <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto space-y-3">
        {Array.isArray(ticket.notes) && ticket.notes.length > 0 ? (
          ticket.notes.map((note, index) => (
            <div key={`${note.timestamp}-${index}-${refreshTrigger}`} className="p-3 bg-white border rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{note.user}</span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(note.timestamp)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {note.action ? (
                  <span className="font-medium">{note.action}: </span>
                ) : null}
                {note.comment || note.content}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No activity yet.
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2 mt-4">
        <div className="flex-1">
          <Textarea
            placeholder="Add a comment to the activity log..."
            value={activityComment}
            onChange={(e) => setActivityComment(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] resize-none"
          />
        </div>
        <Button 
          onClick={handleAddActivityComment}
          disabled={!activityComment.trim() || isSubmittingComment}
          size="sm"
          className="h-10"
        >
          <Send className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
};
