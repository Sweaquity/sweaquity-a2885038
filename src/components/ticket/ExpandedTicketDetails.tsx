import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Trash2 } from "lucide-react";
import { Ticket } from "@/types/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TicketAttachmentsList, checkTicketAttachments } from "@/components/dashboard/TicketAttachmentsList";
import { TicketDetailsTab } from "./details/TicketDetailsTab";
import { TicketConversationTab } from "./details/TicketConversationTab";
import { TicketActivityTab } from "./details/TicketActivityTab";
import { TicketTimeLogTab } from "./details/TicketTimeLogTab";
import { DeleteTicketDialog } from "./details/DeleteTicketDialog";

interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
  onRefresh?: () => void;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket: initialTicket,
  onClose,
  onTicketAction = async () => {},
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true,
  onRefresh
}) => {
  // Keep local copy of ticket that we can update immediately
  const [localTicket, setLocalTicket] = useState<Ticket>(initialTicket);
  const [activeTab, setActiveTab] = useState("details");
  const [hasAttachments, setHasAttachments] = useState(false);
  const [isCheckingAttachments, setIsCheckingAttachments] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local ticket when props change
  useEffect(() => {
    setLocalTicket(initialTicket);
  }, [initialTicket]);

  useEffect(() => {
    if (localTicket.id) {
      checkForAttachments();
    }
  }, [localTicket.id]);

  const checkForAttachments = async () => {
    setIsCheckingAttachments(true);
    const attachmentsExist = await checkTicketAttachments(localTicket.reporter, localTicket.id);
    setHasAttachments(attachmentsExist);
    setIsCheckingAttachments(false);
  };

  const handleAttachmentsLoaded = (hasAttachments: boolean) => {
    setHasAttachments(hasAttachments);
    setIsCheckingAttachments(false);
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      // Update local state immediately for better UX
      setLocalTicket(prev => {
        // Handle different action types
        switch (action) {
          case "updateStatus":
            return { ...prev, status: data };
          case "updatePriority":
            return { ...prev, priority: data };
          case "updateDueDate":
            return { ...prev, due_date: data };
          case "updateEstimatedHours":
            return { ...prev, estimated_hours: data };
          case "updateCompletionPercentage":
            return { ...prev, completion_percentage: data };
          case "updateDescription":
            return { ...prev, description: data };
          default:
            return prev;
        }
      });

      // Call the parent handler (API update)
      await onTicketAction(ticketId, action, data);
      
      // Refresh data if onRefresh is provided
      if (onRefresh) {
        onRefresh();
      }
      
      return true;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      // Don't revert the local state - parent should handle this
      // If we revert here, we might create a bad UX with flickering values
      return false;
    }
  };

  const handleDeleteTicket = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', localTicket.id);
      
      if (error) throw error;
      
      toast.success("Ticket deleted successfully");
      if (onClose) onClose();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{localTicket.title}</h2>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          {(hasAttachments || isCheckingAttachments) && (
            <TabsTrigger value="attachments">
              <div className="flex items-center">
                <Image className="h-4 w-4 mr-1" />
                Attachments
                {isCheckingAttachments && (
                  <span className="ml-1 h-3 w-3 rounded-full bg-gray-200 animate-pulse"></span>
                )}
              </div>
            </TabsTrigger>
          )}
          <TabsTrigger value="time-log">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <TicketDetailsTab 
            ticket={localTicket}
            onTicketAction={handleTicketAction}
            onLogTime={onLogTime}
            userCanEditStatus={userCanEditStatus}
            userCanEditDates={userCanEditDates}
          />
        </TabsContent>
        
        <TabsContent value="conversation">
          <TicketConversationTab 
            ticket={localTicket}
            onTicketAction={handleTicketAction}
          />
        </TabsContent>
        
        <TabsContent value="activity-log">
          <TicketActivityTab 
            ticket={localTicket}
            onTicketAction={handleTicketAction}
          />
        </TabsContent>

        <TabsContent value="attachments" className="mt-0">
          <TicketAttachmentsList 
            reporterId={localTicket.reporter} 
            ticketId={localTicket.id}
            onAttachmentsLoaded={handleAttachmentsLoaded}
          />
        </TabsContent>
        
        <TabsContent value="time-log">
          <TicketTimeLogTab 
            ticketId={localTicket.id}
            onLogTime={onLogTime}
          />
        </TabsContent>
      </Tabs>
      
      <DeleteTicketDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTicket}
        isDeleting={isDeleting}
        ticketTitle={localTicket.title}
      />
    </div>
  );
};
