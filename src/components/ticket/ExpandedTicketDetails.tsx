import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, CheckCircle2, Clock, ListChecks, User2, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { EditorOutput } from "@/components/editor/editor-output";
import { ScrollArea } from "@/components/ui/scroll-area";
import { checkTicketAttachments } from "@/components/dashboard/TicketAttachmentsList";
import { TicketAttachmentsList } from "@/components/dashboard/TicketAttachmentsList";

interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onClose?: () => void;
  onTicketAction?: (ticketId: string, action: string, data: any) => Promise<void>;
  onLogTime?: (ticketId: string) => void;
  userCanEditStatus?: boolean;
  userCanEditDates?: boolean;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({ ticket, onClose, onTicketAction, onLogTime, userCanEditStatus, userCanEditDates }) => {

  const handleTicketAction = async (action: string, data: any = {}) => {
    if (ticket.id) {
      await onTicketAction?.(ticket.id, action, data);
    }
  };

  const renderDetailsSection = () => (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Information about this ticket.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Status:</div>
              <Badge variant="secondary">{ticket.status}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Priority:</div>
              <Badge variant="outline">{ticket.priority}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Health:</div>
              <Badge variant="destructive">{ticket.health}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Type:</div>
              <div>{ticket.ticket_type || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Created At:</div>
              <div>{ticket.created_at ? format(new Date(ticket.created_at), 'PPP') : 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Due Date:</div>
              <div>{ticket.due_date ? format(new Date(ticket.due_date), 'PPP') : 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Assigned To:</div>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span>{ticket.assigned_to || 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Reporter:</div>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span>{ticket.reporter || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Description:</div>
            <EditorOutput content={ticket.description} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActivitySection = () => (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Recent activity on this ticket.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="space-y-4 p-4">
              {ticket.notes && ticket.notes.length > 0 ? (
                ticket.notes.map((note: any) => (
                  <div key={note.id} className="border rounded-md p-3">
                    <div className="flex items-center text-sm text-muted-foreground space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{note.timestamp}</span>
                      <User2 className="h-4 w-4" />
                      <span>{note.user}</span>
                    </div>
                    <div className="text-sm mt-2">{note.comment}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No activity recorded.</div>
              )}
            </div>
          </ScrollArea>
          <Button variant="secondary" onClick={() => handleTicketAction('reply', { message: 'New reply' })}>
            Reply
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttachmentsSection = (ticket: Ticket) => {
    return (
      <div className="p-4 space-y-4">
        <TicketAttachmentsList 
          reporterId={ticket.reporter} 
          ticketId={ticket.id}
          attachmentUrls={ticket.attachments}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container max-w-4xl h-full py-6">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              {ticket.title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="overflow-y-auto h-full">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="details">{renderDetailsSection()}</TabsContent>
              <TabsContent value="activity">{renderActivitySection()}</TabsContent>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <TabsContent value="attachments">{renderAttachmentsSection(ticket)}</TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpandedTicketDetails;
