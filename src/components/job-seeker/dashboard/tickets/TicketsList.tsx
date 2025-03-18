
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketMessage, KanbanColumn } from "@/types/dashboard";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateMessageDialog } from "@/components/job-seeker/dashboard/applications/CreateMessageDialog";
import { useMessaging } from "@/components/job-seeker/dashboard/applications/hooks/useMessaging";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanBoard from "@/components/ui/kanban-board";

interface TicketsListProps {
  userTickets: any[];
  ticketMessages: TicketMessage[];
  onTicketAction: (ticketId: string, action: string, data?: any) => void;
}

export const TicketsList = ({ userTickets, ticketMessages, onTicketAction }: TicketsListProps) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const { fetchMessages } = useMessaging();
  const [tickets, setTickets] = useState<{[key: string]: any}>({});
  const [columns, setColumns] = useState<{[key: string]: KanbanColumn}>({
    'new': { id: 'new', title: 'New', ticketIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
    'review': { id: 'review', title: 'Review', ticketIds: [] },
    'done': { id: 'done', title: 'Done', ticketIds: [] },
    'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] }
  });
  const [activeTab, setActiveTab] = useState('list');
  const [allMessages, setAllMessages] = useState<TicketMessage[]>(ticketMessages);

  useEffect(() => {
    if (userTickets.length > 0) {
      // Process tickets into format needed for kanban board
      const newTickets: {[key: string]: any} = {};
      const newColumns = {
        'new': { id: 'new', title: 'New', ticketIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
        'review': { id: 'review', title: 'Review', ticketIds: [] },
        'done': { id: 'done', title: 'Done', ticketIds: [] },
        'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] }
      };
      
      userTickets.forEach(ticket => {
        newTickets[ticket.id] = {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          due_date: ticket.due_date
        };
        
        // Map status to column
        const columnId = ticket.status === 'closed' ? 'done' : ticket.status;
        if (newColumns[columnId]) {
          newColumns[columnId].ticketIds.push(ticket.id);
        } else {
          // Default to new column if status doesn't match
          newColumns['new'].ticketIds.push(ticket.id);
        }
      });
      
      setTickets(newTickets);
      setColumns(newColumns);
    }
    
    // Load messages for all tickets
    const loadAllMessages = async () => {
      const allMsgs: TicketMessage[] = [...ticketMessages];
      
      for (const ticket of userTickets) {
        if (ticket.id) {
          const msgs = await fetchMessages(ticket.id);
          if (msgs && msgs.length > 0) {
            allMsgs.push(...msgs);
          }
        }
      }
      
      setAllMessages(allMsgs);
    };
    
    loadAllMessages();
  }, [userTickets, ticketMessages]);

  const handleSendMessage = async (message: string) => {
    if (selectedTicketId) {
      await onTicketAction(selectedTicketId, 'reply', { message });
      setIsMessageDialogOpen(false);
    }
  };

  const handleTicketMove = async (ticketId: string, newStatus: string) => {
    try {
      await onTicketAction(ticketId, 'update_status', { status: newStatus });
      
      // Update local state to reflect the change
      const startColumn = Object.values(columns).find(col => 
        col.ticketIds.includes(ticketId)
      );
      
      if (startColumn && columns[newStatus]) {
        const newColumns = { ...columns };
        
        // Remove from current column
        newColumns[startColumn.id].ticketIds = newColumns[startColumn.id].ticketIds
          .filter(id => id !== ticketId);
        
        // Add to new column
        newColumns[newStatus].ticketIds.push(ticketId);
        
        setColumns(newColumns);
      }
    } catch (error) {
      console.error("Error moving ticket:", error);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsMessageDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get ticket messages for a specific ticket
  const getTicketMessages = (ticketId: string) => {
    return allMessages.filter(msg => msg.ticketId === ticketId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>Your reported issues and tasks</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="board">Board View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="list" className="mt-0">
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
                              <p className="font-medium">{msg.subject || 'Reply'}</p>
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
        </TabsContent>
        
        <TabsContent value="board" className="mt-0">
          {userTickets.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">No tickets found</p>
              <p className="text-sm text-gray-500 mt-1">
                You haven't reported any issues yet or no tickets have been assigned to you.
              </p>
            </div>
          ) : (
            <KanbanBoard 
              columns={columns}
              tickets={tickets}
              onTicketMove={handleTicketMove}
              onTicketClick={handleTicketClick}
              formatDate={formatDate}
            />
          )}
        </TabsContent>
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
  
  // Helper functions for displaying status information
  function getStatusIcon(status: string) {
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
  }

  function getStatusColor(status: string) {
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
  }

  function getPriorityColor(priority: string) {
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
  }
};
