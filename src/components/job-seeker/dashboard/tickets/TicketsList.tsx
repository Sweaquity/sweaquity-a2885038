
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketMessage } from "@/types/dashboard";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateMessageDialog } from "@/components/job-seeker/dashboard/applications/CreateMessageDialog";

interface TicketsListProps {
  userTickets: any[];
  ticketMessages: TicketMessage[];
  onTicketAction: (ticketId: string, action: string, data?: any) => void;
}

export const TicketsList = ({ userTickets, ticketMessages, onTicketAction }: TicketsListProps) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const handleSendMessage = async (message: string) => {
    if (selectedTicketId) {
      await onTicketAction(selectedTicketId, 'reply', { message });
      setIsMessageDialogOpen(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'done':
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get ticket messages for a specific ticket
  const getTicketMessages = (ticketId: string) => {
    return ticketMessages.filter(msg => msg.ticketId === ticketId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tickets</CardTitle>
        <CardDescription>Your reported issues and tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {userTickets.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">No tickets found</p>
            <p className="text-sm text-gray-500 mt-1">
              You haven't reported any issues yet or no tickets have been assigned to you.
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Use the "Report Beta Issue" button to report problems or request features.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userTickets.map(ticket => (
              <div key={ticket.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{ticket.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)} 
                        <span className="ml-1">{ticket.status}</span>
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      {ticket.due_date && (
                        <Badge variant="outline">
                          Due: {formatDate(ticket.due_date)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setIsMessageDialogOpen(true);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>

                {/* Show ticket messages if present */}
                {getTicketMessages(ticket.id).length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Messages</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getTicketMessages(ticket.id).map((msg, idx) => (
                        <div 
                          key={msg.id || idx} 
                          className="bg-gray-50 p-3 rounded text-sm"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{msg.subject}</p>
                            <span className="text-xs text-gray-500">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        onSendMessage={handleSendMessage}
        applicationId={selectedTicketId || ''}
        onMessageSent={() => {
          setSelectedTicketId(null);
        }}
      />
    </Card>
  );
};
