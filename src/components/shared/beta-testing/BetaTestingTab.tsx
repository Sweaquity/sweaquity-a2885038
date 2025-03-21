
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  MessageSquare,
  FileText
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { KanbanBoard } from "@/components/shared/beta-testing/KanbanBoard";
import { Badge } from "@/components/ui/badge";

interface BetaTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
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
  attachments?: string[];
  reproduction_steps?: string;
  task_id?: string;
  project_id?: string;
}

export interface BetaTestingTabProps {
  isAdmin?: boolean;
  userId?: string;
  userType: 'job_seeker' | 'business' | 'admin';
}

export function BetaTestingTab({ isAdmin = false, userId, userType }: BetaTestingTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showKanban, setShowKanban] = useState(true);
  const [statistics, setStatistics] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0
  });

  useEffect(() => {
    fetchBetaTickets();
  }, [userId, userType, isAdmin]);

  const fetchBetaTickets = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('ticket_type', 'beta_testing');
      
      // Filter tickets based on user type and ID
      if (!isAdmin) {
        if (userType === 'job_seeker') {
          query = query.eq('reporter', userId);
        } else if (userType === 'business') {
          // For business users, get tickets related to their projects
          const { data: projects } = await supabase
            .from('business_projects')
            .select('project_id')
            .eq('business_id', userId);
            
          if (projects && projects.length > 0) {
            const projectIds = projects.map(p => p.project_id);
            query = query.in('project_id', projectIds);
          }
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching beta tickets:", error);
        toast.error("Failed to load beta tickets");
        return;
      }

      const processedTickets: BetaTicket[] = await Promise.all(
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

      setBetaTickets(processedTickets);
      calculateStatistics(processedTickets);
      setIsLoading(false);
    } catch (err) {
      console.error("Error in fetchBetaTickets:", err);
      toast.error("Failed to load beta tickets data");
      setIsLoading(false);
    }
  };

  const calculateStatistics = (tickets: BetaTicket[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status !== 'done' && ticket.status !== 'closed').length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high').length;

    setStatistics({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets
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
      
      let notes = ticketData.notes || [];
      
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
      
      setBetaTickets(prev => prev.map(t => 
        t.id === ticketId ? {...t, newNote: ''} : t
      ));
      
      await fetchBetaTickets();
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

      setBetaTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
      calculateStatistics(betaTickets.map(ticket =>
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

      setBetaTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      calculateStatistics(betaTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      ));
      toast.success("Ticket priority updated successfully");
    } catch (error) {
      console.error("Error updating ticket priority:", error);
      toast.error("Failed to update ticket priority");
    }
  };

  const handleReplyToReporter = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setReplyDialogOpen(true);
  };

  const sendReplyToReporter = async () => {
    if (!activeTicketId || !replyMessage.trim()) return;
    
    try {
      const ticket = betaTickets.find(t => t.id === activeTicketId);
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
      
      let notes = ticketData.notes || [];
      
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
      await fetchBetaTickets();
      toast.success("Reply recorded in ticket history");
      
    } catch (err) {
      console.error("Error in sendReplyToReporter:", err);
      toast.error("Failed to send reply");
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

      setBetaTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, due_date: newDueDate } : ticket
      ));
      toast.success("Due date updated successfully");
    } catch (error) {
      console.error("Error setting due date:", error);
      toast.error("Failed to set due date");
    }
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setBetaTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Beta Testing Tickets</CardTitle>
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
                onClick={fetchBetaTickets}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
          <CardDescription>Manage beta testing feedback and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-blue-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{statistics.totalTickets}</p>
                </div>
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-amber-600">Open Tickets</p>
                  <p className="text-2xl font-bold">{statistics.openTickets}</p>
                </div>
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-green-600">Closed Tickets</p>
                  <p className="text-2xl font-bold">{statistics.closedTickets}</p>
                </div>
                <div className="p-1.5 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-red-600">High Priority</p>
                  <p className="text-2xl font-bold">{statistics.highPriorityTickets}</p>
                </div>
                <div className="p-1.5 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>
          </div>
          
          {showKanban && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Ticket Board</h3>
              <div className="border rounded-lg overflow-x-auto">
                <KanbanBoard 
                  tickets={betaTickets} 
                  onStatusChange={handleUpdateTicketStatus}
                  onTicketClick={toggleTicketExpanded}
                />
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-4">All Tickets</h3>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : betaTickets.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No beta testing tickets found.</p>
              </div>
            ) : (
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
                  {betaTickets.map(ticket => (
                    <>
                      <TableRow key={ticket.id} className="group">
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
                                  {ticket.notes && ticket.notes.length > 0 ? (
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
                                    onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
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
                                    onValueChange={(value) => handleUpdateTicketPriority(ticket.id, value)}
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
                                    onChange={(e) => handleSetDueDate(ticket.id, e.target.value)}
                                  />
                                </div>
                                
                                {ticket.reporter && (
                                  <div className="ml-auto">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleReplyToReporter(ticket.id)}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
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
                                      setBetaTickets(prev => prev.map(t => 
                                        t.id === ticket.id ? {...t, newNote: e.target.value} : t
                                      ));
                                    }}
                                  />
                                  <Button 
                                    className="self-end" 
                                    onClick={() => handleAddTicketNote(ticket.id, ticket.newNote || '')}
                                  >
                                    Add Note
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
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
    </div>
  );
}
