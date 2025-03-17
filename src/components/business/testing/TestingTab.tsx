
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChartView } from "./GanttChartView";
import { TimeTracker } from "./TimeTracker";

export function TestingTab() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [ticketNote, setTicketNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    highPriority: 0,
  });

  useEffect(() => {
    fetchUserProjects();
    fetchTickets();
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      calculateTicketStats();
    }
  }, [tickets]);

  const fetchUserProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data, error } = await supabase
        .from('business_projects')
        .select('project_id, title')
        .eq('business_id', session.user.id);
        
      if (error) throw error;
      
      setProjects(data || []);
      
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].project_id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      // First get the project IDs for this business
      const { data: projectData, error: projectError } = await supabase
        .from('business_projects')
        .select('project_id')
        .eq('business_id', session.user.id);
        
      if (projectError) throw projectError;
      
      if (!projectData || projectData.length === 0) {
        setLoading(false);
        return;
      }
      
      const projectIds = projectData.map(p => p.project_id);
      
      // Then get tickets for these projects
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to(id, email),
          reporter_user:reporter(id, email)
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const calculateTicketStats = () => {
    const openTickets = tickets.filter(ticket => 
      ['new', 'in_progress', 'review'].includes(ticket.status || "")
    ).length;
    
    const highPriorityTickets = tickets.filter(ticket => 
      ticket.priority === 'high' || ticket.priority === 'urgent'
    ).length;
    
    setTicketStats({
      total: tickets.length,
      open: openTickets,
      highPriority: highPriorityTickets
    });
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      fetchTickets();
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      fetchTickets();
      toast.success(`Ticket priority updated to ${newPriority}`);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast.error('Failed to update ticket priority');
    }
  };

  const handleAddTicketNote = async (ticketId: string) => {
    if (!ticketNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in');
        return;
      }
      
      const currentTicket = tickets.find(t => t.id === ticketId);
      const currentNotes = currentTicket?.notes || [];
      
      const newNote = {
        content: ticketNote,
        created_at: new Date().toISOString(),
        created_by: session.user.id,
        created_by_email: session.user.email
      };
      
      const updatedNotes = [...currentNotes, newNote];
      
      const { error } = await supabase
        .from('tickets')
        .update({ notes: updatedNotes })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      setTicketNote('');
      fetchTickets();
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleSetDueDate = async (ticketId: string) => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ due_date: selectedDate.toISOString().split('T')[0] })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      setSelectedDate(undefined);
      setIsDatePickerOpen(false);
      fetchTickets();
      toast.success('Due date set successfully');
    } catch (error) {
      console.error('Error setting due date:', error);
      toast.error('Failed to set due date');
    }
  };

  const sendReplyToReporter = async (ticketId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in');
        return;
      }
      
      const currentTicket = tickets.find(t => t.id === ticketId);
      const currentReplies = currentTicket?.replies || [];
      
      const newReply = {
        content: replyText,
        created_at: new Date().toISOString(),
        created_by: session.user.id,
        created_by_email: session.user.email
      };
      
      const updatedReplies = [...currentReplies, newReply];
      
      const { error } = await supabase
        .from('tickets')
        .update({ replies: updatedReplies })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      setReplyText('');
      fetchTickets();
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    const searchMatch = searchQuery ? 
      (ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())) : 
      true;
    
    // Status filter
    const statusMatch = statusFilter === 'all' ? 
      true : 
      statusFilter === 'open' ? 
        ['new', 'in_progress', 'review'].includes(ticket.status) :
      statusFilter === 'high_priority' ?
        (ticket.priority === 'high' || ticket.priority === 'urgent') :
        ticket.status === statusFilter;
    
    return searchMatch && statusMatch;
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Project Management Tools</h2>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="overview" 
          className="space-y-4"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="overview">Projects Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="task-completion">Task Completion</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors" 
                onClick={() => setStatusFilter("all")}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                    <p className="text-2xl font-bold">{ticketStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors" 
                onClick={() => setStatusFilter("open")}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                    <p className="text-2xl font-bold">{ticketStats.open}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-gray-50 transition-colors" 
                onClick={() => setStatusFilter("high_priority")}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">High Priority</p>
                    <p className="text-2xl font-bold">{ticketStats.highPriority}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="open">Open Tickets</SelectItem>
                  <SelectItem value="high_priority">High Priority</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <p>Loading tickets...</p>
              ) : filteredTickets.length === 0 ? (
                <p>No tickets found.</p>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{ticket.title}</h3>
                            <Badge variant={
                              ticket.priority === 'high' ? "destructive" : 
                              ticket.priority === 'medium' ? "default" : 
                              "secondary"
                            }>
                              {ticket.priority}
                            </Badge>
                            <Badge variant={
                              ticket.status === 'new' ? "outline" : 
                              ticket.status === 'in_progress' ? "default" : 
                              ticket.status === 'review' ? "secondary" : 
                              "success"
                            }>
                              {ticket.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56">
                              <div className="grid gap-2">
                                <div className="grid gap-1">
                                  <p className="text-sm font-medium">Update Status</p>
                                  <Select 
                                    value={ticket.status} 
                                    onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="review">Review</SelectItem>
                                      <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="grid gap-1">
                                  <p className="text-sm font-medium">Update Priority</p>
                                  <Select 
                                    value={ticket.priority} 
                                    onValueChange={(value) => handleUpdateTicketPriority(ticket.id, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="grid gap-1">
                                  <p className="text-sm font-medium">Set Due Date</p>
                                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                      />
                                      <div className="p-2 border-t flex justify-end">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleSetDueDate(ticket.id)}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          {ticket.reporter_user?.email && (
                            <p>Reported by: {ticket.reporter_user.email}</p>
                          )}
                          {ticket.due_date && (
                            <p>Due: {new Date(ticket.due_date).toLocaleDateString()}</p>
                          )}
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                        >
                          {expandedTicketId === ticket.id ? "Hide details" : "Show details"}
                        </Button>
                      </div>
                      
                      {expandedTicketId === ticket.id && (
                        <div className="px-4 pb-4 border-t pt-4">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Description</h4>
                            <p className="text-sm whitespace-pre-wrap">
                              {ticket.description || "No description provided."}
                            </p>
                          </div>
                          
                          {(ticket.replies && ticket.replies.length > 0) && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Replies</h4>
                              <div className="space-y-2">
                                {ticket.replies.map((reply: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                                    <p className="text-xs text-gray-500">
                                      {reply.created_by_email} - {new Date(reply.created_at).toLocaleString()}
                                    </p>
                                    <p>{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Reply to Reporter</h4>
                            <Textarea
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="mb-2"
                            />
                            <Button size="sm" onClick={() => sendReplyToReporter(ticket.id)}>
                              Send Reply
                            </Button>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Add Note (Internal)</h4>
                            <Textarea
                              placeholder="Add a note (only visible to team members)..."
                              value={ticketNote}
                              onChange={(e) => setTicketNote(e.target.value)}
                              className="mb-2"
                            />
                            <Button size="sm" onClick={() => handleAddTicketNote(ticket.id)}>
                              Add Note
                            </Button>
                          </div>
                          
                          {(ticket.notes && ticket.notes.length > 0) && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Notes</h4>
                              <div className="space-y-2">
                                {ticket.notes.map((note: any, index: number) => (
                                  <div key={index} className="bg-gray-100 p-2 rounded text-sm">
                                    <p className="text-xs text-gray-500">
                                      {note.created_by_email} - {new Date(note.created_at).toLocaleString()}
                                    </p>
                                    <p>{note.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Applications for Your Projects</h3>
                {/* Applications content would go here */}
                <p>Applications component will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="task-completion" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Task Completion Status</h3>
                {/* Task completion content would go here */}
                <p>Task completion tracking will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kanban" className="space-y-4">
            <KanbanBoard 
              projectId={selectedProjectId} 
              onTicketSelect={(ticketId) => setSelectedTicketId(ticketId)}
            />
          </TabsContent>
          
          <TabsContent value="gantt" className="space-y-4">
            <GanttChartView projectId={selectedProjectId} />
          </TabsContent>
          
          <TabsContent value="time-tracking" className="space-y-4">
            <TimeTracker 
              ticketId={selectedTicketId || ""} 
              userId="" // This will be populated with the current user's ID
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
