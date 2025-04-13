
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ticket,
  onClose,
  onTicketAction = async () => {},
  onLogTime,
  userCanEditStatus = true,
  userCanEditDates = true,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [hasAttachments, setHasAttachments] = useState(false);
  const [isCheckingAttachments, setIsCheckingAttachments] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const attachmentsChecked = useRef(false);

  // Use useCallback to memoize the function
  const checkForAttachments = useCallback(async () => {
    if (!ticket.id || !ticket.reporter || attachmentsChecked.current) return;
    
    setIsCheckingAttachments(true);
    try {
      const attachmentsExist = await checkTicketAttachments(ticket.reporter, ticket.id);
      setHasAttachments(attachmentsExist);
      attachmentsChecked.current = true;
    } catch (error) {
      console.error("Error checking attachments:", error);
    } finally {
      setIsCheckingAttachments(false);
    }
  }, [ticket.id, ticket.reporter]);

  useEffect(() => {
    // Reset the ref when ticket changes
    if (ticket.id) {
      attachmentsChecked.current = false;
      checkForAttachments();
    }
  }, [ticket.id, checkForAttachments]);

  const handleAttachmentsLoaded = useCallback((hasAttachments: boolean) => {
    setHasAttachments(hasAttachments);
    setIsCheckingAttachments(false);
    attachmentsChecked.current = true;
  }, []);

  const handleDeleteTicket = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.id);
      
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
        <h2 className="text-xl font-bold">{ticket.title}</h2>
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
            ticket={ticket}
            onTicketAction={onTicketAction}
            onLogTime={onLogTime}
            userCanEditStatus={userCanEditStatus}
            userCanEditDates={userCanEditDates}
          />
        </TabsContent>
        
        <TabsContent value="conversation">
          <TicketConversationTab 
            ticket={ticket}
            onTicketAction={onTicketAction}
          />
        </TabsContent>
        
        <TabsContent value="activity-log">
          <TicketActivityTab 
            ticket={ticket}
            onTicketAction={onTicketAction}
          />
        </TabsContent>

        <TabsContent value="attachments" className="mt-0">
          {activeTab === 'attachments' && ticket.reporter && ticket.id && (
            <TicketAttachmentsList 
              reporterId={ticket.reporter} 
              ticketId={ticket.id}
              onAttachmentsLoaded={handleAttachmentsLoaded}
            />
          )}
        </TabsContent>
        
        <TabsContent value="time-log">
          <TicketTimeLogTab 
            ticketId={ticket.id}
            onLogTime={onLogTime}
          />
        </TabsContent>
      </Tabs>
      
      <DeleteTicketDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTicket}
        isDeleting={isDeleting}
        ticketTitle={ticket.title}
      />
    </div>
  );
};
