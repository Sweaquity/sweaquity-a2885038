
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { Ticket } from "@/types/types";
import { formatDateTime } from "../utils/dateFormatters";

interface TicketConversationTabProps {
  ticket: Ticket;
  onTicketAction: (ticketId: string, action: string, data: any) => Promise<void>;
}

export const TicketConversationTab: React.FC<TicketConversationTabProps> = ({
  ticket,
  onTicketAction
}) => {
  const [conversationMessage, setConversationMessage] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddConversationMessage = async () => {
    if (!conversationMessage.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await onTicketAction(ticket.id, "addReply", conversationMessage);
      setConversationMessage("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md border mb-4">
        <p className="text-sm text-gray-500">
          Use this tab to communicate with others about this ticket.
        </p>
      </div>
      
      <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto space-y-3">
        {Array.isArray(ticket.replies) && ticket.replies.length > 0 ? (
          ticket.replies.map((reply, index) => (
            <div key={index} className="p-3 bg-white border rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{reply.user}</span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(reply.timestamp)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.comment}</p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No conversation messages yet.
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2 mt-4">
        <div className="flex-1">
          <Textarea
            placeholder="Type your message here..."
            value={conversationMessage}
            onChange={(e) => setConversationMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
        <Button 
          onClick={handleAddConversationMessage}
          disabled={!conversationMessage.trim() || isSubmittingComment}
          size="sm"
          className="h-10"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
};
