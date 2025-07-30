// TicketManagement.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TicketKanbanBoard } from "./KanbanBoard";
import { TicketGanttChart } from "./GanttChart";
import { TicketStatistics } from "./TicketStats";
import { toast } from "sonner";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  reporter_email?: string;
  reporter?: string;
  expanded?: boolean;
  newNote?: string;
  notes?: Array<{
    action: string;
    user: string;
    timestamp: string;
    comment?: string;
  }> | null;
  system_info?: {
    url: string;
    userAgent: string;
    timestamp: string;
    viewportSize: string;
    referrer: string;
  };
  reported_url?: string;
  attachments?: string[];
  reproduction_steps?: string;
}

export interface StatisticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

interface TicketManagementProps {
  supabase: any;
  initialTickets?: Ticket[];
  fetchTicketsQuery?: string;
  title?: string;
  description?: string;
  onRefreshData?: () => Promise<void>;
}

const TicketManagement: React.FC<TicketManagementProps> = ({
  supabase,
  initialTickets = [],
  fetchTicketsQuery = "title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%",
  title = "Ticket Management",
  description = "Manage tickets and issues",
  onRefreshData
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(true);
  const [ticketStats, setTicketStats] = useState<StatisticsData>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });

  useEffect(() => {
    if (initialTickets.length === 0) {
      fetchTickets();
    } else {
      setTickets(initialTickets);
      calculateTicketStatistics(initialTickets);
      setIsLoading(false);
    }
  }, [initialTickets]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(fetchTicketsQuery)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
        setIsLoading(false);
        return;
      }

      const processedTickets: Ticket[] = await Promise.all(
        data.map(async (ticket: any) => {
          let reporterEmail = null;
          
          if (ticket.reporter) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', ticket.reporter)
              .maybeSingle();
              
            reporterEmail = profileData?.email;
          }
          
          return {
            ...ticket,
            reporter_email: reporterEmail,
            expanded: false,
            newNote: ''
          };
        })
      );

      setTickets(processedTickets);
      calculateTicketStatistics(processedTickets);
      setIsLoading(false);
    } catch (err) {
      console.error("Error in fetchTickets:", err);
      toast.error("Failed to load tickets data");
      setIsLoading(false);
    }
  };

  const calculateTicketStatistics = (tickets: Ticket[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed').length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;

    const byStatus: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};

    tickets.forEach(ticket => {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;
    });

    setTicketStats({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority,
    });
  };

  const handleAddTicketNote = async (ticketId: string, note: string) => {
    if (!note.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to add notes");
        return;
      }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      const userName = userData?.first_name 
        ? `${userData.first_name} ${userData.last_name || ''}`
        : userData?.email || user.email || 'Unknown User';
      
      const { data: ticketData, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', ticketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to add note");
        return;
      }
      
      const notes = ticketData.notes || [];
      
      notes.push({
        action: 'Note added',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: note
      });
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (updateError) {
        console.error("Error updating ticket:", updateError);
        toast.error("Failed to add note");
        return;
      }
      
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? {...t, newNote: ''} : t
      ));
      
      await fetchTickets();
      toast.success("Note added successfully");
      
    } catch (err) {
      console.error("Error in handleAddTicketNote:", err);
      toast.error("Failed to add note");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket status:", error);
        toast.error("Failed to update ticket status");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      calculateTicketStatistics(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      toast.success("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket priority:", error);
        toast.error("Failed to update ticket priority");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      calculateTicketStatistics(tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      toast.success("Ticket priority updated successfully");
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleSetDueDate = async (ticketId: string, newDueDate: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ due_date: newDueDate })
        .eq('id', ticketId);

      if (error) {
        console.error("Error setting due date:", error);
        toast.error("Failed to set due date");
        return;
      }

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, due_date: newDueDate } : ticket
      ));
      toast.success("Due date updated successfully");
    } catch (error) {
      console.error("Error setting due date:", error);
      toast.error("Failed to set due date");
    }
  };

  const handleReplyToReporter = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setReplyDialogOpen(true);
  };

  const sendReplyToReporter = async () => {
    if (!activeTicketId || !replyMessage.trim()) return;
    
    try {
      const ticket = tickets.find(t => t.id === activeTicketId);
      if (!ticket || !ticket.reporter) {
        toast.error("Cannot find reporter information");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to reply");
        return;
      }
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', user.id)
        .single();
        
      const userName = userData?.first_name 
        ? `${userData.first_name} ${userData.last_name || ''}`
        : userData?.email || user.email || 'Unknown User';
      
      // Create the user_messages table if it doesn't exist
      const { error: tableCheckError } = await supabase
        .from('user_messages')
        .select('id', { count: 'exact', head: true });
      
      if (tableCheckError) {
        // Create the user_messages table if it doesn't exist
        const { error: createTableError } = await supabase.rpc('create_messages_table_if_not_exists');
        if (createTableError) {
          console.error("Error creating messages table:", createTableError);
          toast.error("Failed to send reply: messaging system not available");
          return;
        }
      }
      
      // Send a message to the reporter
      const { error: messageError } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          recipient_id: ticket.reporter,
          subject: `Re: ${ticket.title}`,
          message: replyMessage,
          related_ticket: activeTicketId,
          read: false
        });
        
      if (messageError) {
        console.error("Error sending message:", messageError);
        toast.error("Failed to send reply to user dashboard, but message recorded in ticket notes");
      } else {
        toast.success("Reply sent to reporter's dashboard");
      }
      
      // Also update the ticket notes for history tracking
      const { data: ticketData, error: fetchError } = await supabase
        .from('tickets')
        .select('notes')
        .eq('id', activeTicketId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching ticket:", fetchError);
        toast.error("Failed to update ticket notes");
        return;
      }
      
      const notes = ticketData.notes || [];
      
      notes.push({
        action: 'Reply sent to reporter',
        user: userName,
        timestamp: new Date().toISOString(),
        comment: replyMessage
      });
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTicketId);
        
      if (updateError) {
        console.error("Error updating ticket notes:", updateError);
        toast.error("Failed to record reply in ticket history");
        return;
      }
      
      setReplyDialogOpen(false);
      setActiveTicketId(null);
      setReplyMessage('');
      await fetchTickets();
      toast.success("Reply recorded in ticket history");
      
    } catch (err) {
      console.error("Error in sendReplyToReporter:", err);
      toast.error("Failed to send reply");
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    if (onRefreshData) {
      await onRefreshData();
    } else {
      await fetchTickets();
    }
    setIsLoading(false);
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKanban(!showKanban)}
            >
              {showKanban ? "Hide" : "Show"} Kanban Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGantt(!showGantt)}
            >
              {showGantt ? "Hide" : "Show"} Gantt Chart
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TicketStatistics stats={ticketStats} isLoading={isLoading} />
        
        {showKanban && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Ticket Board</h3>
            <div className="border rounded-lg overflow-hidden">
              <TicketKanbanBoard 
                tickets={tickets} 
                onStatusUpdate={handleUpdateTicketStatus} 
                onToggleExpand={toggleTicketExpanded}
                formatDate={formatDate}
              />
            </div>
          </div>
        )}
        
        {showGantt && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Timeline</h3>
            <div className="border rounded-lg overflow-hidden p-4">
              <TicketGanttChart tickets={tickets} />
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-4">All Tickets</h3>
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <React.Fragment key={ticket.id}>
                  <TableRow className="group">
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                        ticket.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'done' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>{ticket.due_date ? formatDate(ticket.due_date) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTicketExpanded(ticket.id)}
                      >
                        {ticket.expanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {ticket.expanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 border-t-0">
                        <ExpandedTicketDetails 
                          ticket={ticket}
                          onAddNote={handleAddTicketNote}
                          onUpdateStatus={handleUpdateTicketStatus}
                          onUpdatePriority={handleUpdateTicketPriority}
                          onSetDueDate={handleSetDueDate}
                          onReplyToReporter={handleReplyToReporter}
                          formatDate={formatDate}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reply to Reporter</DialogTitle>
            <DialogDescription>
              Your message will be sent to the user who reported this issue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your reply here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendReplyToReporter}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface ExpandedTicketDetailsProps {
  ticket: Ticket;
  onAddNote: (ticketId: string, note: string) => Promise<void>;
  onUpdateStatus: (ticketId: string, newStatus: string) => Promise<void>;
  onUpdatePriority: (ticketId: string, newPriority: string) => Promise<void>;
  onSetDueDate: (ticketId: string, newDueDate: string) => Promise<void>;
  onReplyToReporter: (ticketId: string) => void;
  formatDate: (dateString: string) => string;
}

export const ExpandedTicketDetails: React.FC<ExpandedTicketDetailsProps> = ({
  ticket,
  onAddNote,
  onUpdateStatus,
  onUpdatePriority,
  onSetDueDate,
  onReplyToReporter,
  formatDate
}) => {
  return (
    <div className="p-4 border-t">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Created: </span>
              {formatDate(ticket.created_at)}
            </div>
            {ticket.due_date && (
              <div>
                <span className="text-gray-500">Due: </span>
                {formatDate(ticket.due_date)}
              </div>
            )}
            {ticket.reporter_email && (
              <div>
                <span className="text-gray-500">Reporter: </span>
                {ticket.reporter_email}
              </div>
            )}
            {ticket.reported_url && (
              <div>
                <span className="text-gray-500">URL: </span>
                <span className="text-blue-500 underline">{ticket.reported_url}</span>
              </div>
            )}
          </div>
          
          {ticket.system_info && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p className="font-medium mb-1">System Info:</p>
              <div className="grid grid-cols-2 gap-1">
                <div><span className="text-gray-500">Browser: </span>{ticket.system_info.userAgent}</div>
                <div><span className="text-gray-500">Screen: </span>{ticket.system_info.viewportSize}</div>
                <div><span className="text-gray-500">Time: </span>{new Date(ticket.system_info.timestamp).toLocaleString()}</div>
                <div><span className="text-gray-500">Referrer: </span>{ticket.system_info.referrer}</div>
              </div>
            </div>
          )}
        </div>
        
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Screenshots ({ticket.attachments.length})</p>
            <div className="grid grid-cols-2 gap-2">
              {ticket.attachments.map((url, i) => (
                <div key={i} className="relative group border rounded overflow-hidden h-36">
                  <img 
                    src={url} 
                    alt={`Screenshot ${i+1}`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white"
                      onClick={() => window.open(url, '_blank')}
                    >
                      View Full
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
        <div className="space-y-2 text-sm pl-4 border-l-2 border-gray-200">
          {ticket.notes ? (
            ticket.notes.map((activity, index) => (
              <div key={index} className="relative pl-4 pb-2">
                <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px]"></div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()} by {activity.user}
                </p>
                {activity.comment && (
                  <p className="mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                    {activity.comment}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No activity recorded yet</p>
          )}
        </div>
      </div>
      
      <div className="border-t pt-4 flex flex-wrap gap-4">
        <div>
          <Label htmlFor={`status-${ticket.id}`} className="text-xs block mb-1">Update Status</Label>
          <Select
            defaultValue={ticket.status}
            onValueChange={(value) => onUpdateStatus(ticket.id, value)}
          >
            <SelectTrigger id={`status-${ticket.id}`} className="w-[140px]">
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
          <Label htmlFor={`priority-${ticket.id}`} className="text-xs block mb-1">Update Priority</Label>
          <Select
            defaultValue={ticket.priority}
            onValueChange={(value) => onUpdatePriority(ticket.id, value)}
          >
            <SelectTrigger id={`priority-${ticket.id}`} className="w-[140px]">
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
          <Label htmlFor={`due-date-${ticket.id}`} className="text-xs block mb-1">Set Due Date</Label>
          <Input
            id={`due-date-${ticket.id}`}
            type="date"
            className="w-[180px]"
            value={ticket.due_date ? new Date(ticket.due_date).toISOString().split('T')[0] : ''}
            onChange={(e) => onSetDueDate(ticket.id, e.target.value)}
          />
        </div>
        
        {ticket.reporter && (
          <div className="ml-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onReplyToReporter(ticket.id)}
            >
              Reply to Reporter
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-4 border-t pt-4">
        <Label htmlFor={`note-${ticket.id}`} className="text-sm font-medium mb-1 block">Add Note</Label>
        <div className="flex gap-2">
          <Textarea 
            id={`note-${ticket.id}`}
            placeholder="Add a note about this ticket..."
            className="min-h-[80px]"
            value={ticket.newNote || ''}
            onChange={(e) => {
              // This is handled internally in the parent component
            }}
          />
          <Button 
            className="self-end" 
            onClick={() => onAddNote(ticket.id, ticket.newNote || '')}
          >
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;
