import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AdminTicketManager } from "@/components/admin/tickets/AdminTicketManager";
import { Task, TaskType, KanbanColumn, DragResult } from "@/types/dashboard";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
  reported_url?: string;
  attachments?: string[];
  reproduction_steps?: string;
}

interface StatisticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  highPriorityTickets: number;
  byStatus: { [key: string]: number };
  byPriority: { [key: string]: number };
}

const SweaquityDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState<StatisticsData>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {},
  });
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(true);

  useEffect(() => {
    loadBetaTickets();
  }, []);

  const loadBetaTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, title, description, status, priority, health, due_date, created_at, updated_at,
          reporter_email:reporter(email),
          reporter,
          system_info,
          reported_url,
          attachments,
          reproduction_steps,
          notes
        `)
        .eq('ticket_type', 'beta_testing');

      if (error) {
        console.error("Error fetching beta tickets:", error);
        toast.error("Failed to load beta testing tickets");
        return;
      }

      const ticketsWithExpanded = data.map(ticket => ({ ...ticket, expanded: false, newNote: '' }));
      setBetaTickets(ticketsWithExpanded);
      calculateStatistics(ticketsWithExpanded);
    } catch (error) {
      console.error("Error loading beta tickets:", error);
      toast.error("Failed to load beta testing tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = (tickets: BetaTicket[]) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setBetaTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
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

  const handleReplyToReporter = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setReplyDialogOpen(true);
  };

  const handleAddTicketNote = async (ticketId: string, newNote: string) => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to add notes");
        return;
      }

      const newActivity = {
        action: "Note Added",
        user: user.email || "Unknown User",
        timestamp: new Date().toISOString(),
        comment: newNote
      };

      const { error } = await supabase
        .from('tickets')
        .update({
          notes: betaTickets.find(t => t.id === ticketId)?.notes ? [...betaTickets.find(t => t.id === ticketId)!.notes!, newActivity] : [newActivity]
        })
        .eq('id', ticketId);

      if (error) {
        console.error("Error adding ticket note:", error);
        toast.error("Failed to add ticket note");
        return;
      }

      setBetaTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, notes: ticket.notes ? [...ticket.notes, newActivity] : [newActivity], newNote: '' } : ticket
      ));
      toast.success("Note added to ticket");
    } catch (error) {
      console.error("Error adding ticket note:", error);
      toast.error("Failed to add ticket note");
    }
  };

  const getGanttTasks = (): Task[] => {
    return betaTickets.map((ticket) => {
      const startDate = new Date(ticket.created_at);
      let endDate = ticket.due_date ? new Date(ticket.due_date) : new Date();
      
      if (!ticket.due_date || endDate < new Date()) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
      }
      
      return {
        id: ticket.id,
        name: ticket.title,
        start: startDate,
        end: endDate,
        type: 'task' as TaskType,
        progress: ticket.status === 'done' || ticket.status === 'closed' ? 100 : 
                 ticket.status === 'in-progress' ? 50 : 
                 ticket.status === 'review' ? 75 : 25,
        isDisabled: false,
        styles: { 
          progressColor: 
            ticket.priority === 'high' ? '#ef4444' : 
            ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6'
        }
      };
    });
  };

  const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {icon}
          <div>
            <CardTitle className="text-2xl font-bold">{isLoading ? "Loading..." : value}</CardTitle>
            <CardDescription className="text-gray-500">{title}</CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  interface KanbanTicket {
    id: string;
    title: string;
    status: string;
  }
  
  interface KanbanData {
    columns: {
      [columnId: string]: KanbanColumn;
    };
    tickets: {
      [ticketId: string]: KanbanTicket;
    };
    columnOrder: string[];
  }
  
  const getKanbanTickets = (): KanbanData => {
    const initialData: KanbanData = {
      columns: {
        'new': {
          id: 'new',
          title: 'New',
          ticketIds: [],
        },
        'in-progress': {
          id: 'in-progress',
          title: 'In Progress',
          ticketIds: [],
        },
        'blocked': {
          id: 'blocked',
          title: 'Blocked',
          ticketIds: [],
        },
        'review': {
          id: 'review',
          title: 'Review',
          ticketIds: [],
        },
        'done': {
          id: 'done',
          title: 'Done',
          ticketIds: [],
        },
        'closed': {
          id: 'closed',
          title: 'Closed',
          ticketIds: [],
        },
      },
      tickets: {},
      columnOrder: ['new', 'in-progress', 'blocked', 'review', 'done', 'closed'],
    };
  
    betaTickets.forEach((ticket) => {
      initialData.tickets[ticket.id] = {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
      };
      initialData.columns[ticket.status].ticketIds.push(ticket.id);
    });
  
    return initialData;
  };

  const KanbanBoard = () => {
    const { columns, tickets } = getKanbanTickets();
    
    const onDragEnd = (result: DragResult) => {
      const { source, destination, draggableId } = result;
      
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      
      handleUpdateTicketStatus(draggableId, destination.droppableId);
    };
    
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex overflow-x-auto">
          {getKanbanTickets().columnOrder.map((columnId) => {
            const column = columns[columnId];
            const columnTickets = column.ticketIds.map((ticketId) => tickets[ticketId]);
            
            return (
              <Droppable droppableId={columnId} key={columnId}>
                {(provided) => (
                  <div
                    className="w-64 p-4 flex-shrink-0"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <h3 className="font-semibold mb-2">{column.title}</h3>
                    {columnTickets.map((ticket, index) => (
                      <Draggable draggableId={ticket.id} index={index} key={ticket.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white rounded shadow p-3 mb-2 last:mb-0"
                          >
                            {ticket.title}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    );
  };

  const ExpandedTicketDetails = ({ ticket }: { ticket: BetaTicket }) => {
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
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sweaquity Admin Dashboard</h1>
          <p className="text-gray-500">Manage platform statistics and beta testing feedback</p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => toast.info("Feature coming soon!")}>
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button variant="outline" onClick={() => toast.info("Feature coming soon!")}>
            <Building className="mr-2 h-4 w-4" />
            Manage Projects
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">
            <Briefcase className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <FileText className="mr-2 h-4 w-4" />
            Beta Testing
          </TabsTrigger>
          <TabsTrigger value="applications">
            <CheckCircle className="mr-2 h-4 w-4" />
            Applications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Tickets"
              value={ticketStats.totalTickets}
              icon={<FileText className="h-6 w-6 text-gray-500" />}
              isLoading={isLoading}
            />
            <StatCard
              title="Open Tickets"
              value={ticketStats.openTickets}
              icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />}
              isLoading={isLoading}
            />
            <StatCard
              title="Closed Tickets"
              value={ticketStats.closedTickets}
              icon={<CheckCircle className="h-6 w-6 text-green-500" />}
              isLoading={isLoading}
            />
            <StatCard
              title="High Priority"
              value={ticketStats.highPriorityTickets}
              icon={<CircleDollarSign className="h-6 w-6 text-red-500" />}
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Distribution of tickets across different statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(ticketStats.byStatus).map(([name, value]) => ({ name, value }))}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
                <CardDescription>Distribution of tickets based on priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(ticketStats.byPriority).map(([name, value]) => ({ name, value }))}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Beta Testing Visualization</CardTitle>
              <div className="flex items-center space-x-4">
                <Button 
                  variant={showKanban ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowKanban(!showKanban)}
                >
                  {showKanban ? "Hide Kanban" : "Show Kanban"}
                </Button>
                <Button 
                  variant={showGantt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGantt(!showGantt)}
                >
                  {showGantt ? "Hide Gantt" : "Show Gantt"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {showKanban && (
                    <div>
                      <h3 className="font-medium mb-2">Kanban Board</h3>
                      <div className="border rounded-md">
                        <KanbanBoard />
                      </div>
                    </div>
                  )}
                  
                  {showGantt && betaTickets.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Gantt Chart</h3>
                      <div className="border rounded-md p-4 h-[300px]">
                        <GanttChartView tasks={getGanttTasks()} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Beta Testing Tickets</CardTitle>
              <CardDescription>Manage and respond to user-reported issues</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-24 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Total Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.totalTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Open Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.openTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Closed Tickets</p>
                          <p className="text-3xl font-bold">{ticketStats.closedTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">High Priority</p>
                          <p className="text-3xl font-bold">{ticketStats.highPriorityTickets}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {betaTickets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {betaTickets.map(ticket => (
                          <React.Fragment key={ticket.id}>
                            <TableRow>
                              <TableCell className="font-medium">{ticket.title}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  ticket.status === 'done' || ticket.status === 'closed' ? 'bg-green-100 text-green-800' : 
                                  ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                                  ticket.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ticket.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {ticket.priority}
                                </span>
                              </TableCell>
                              <TableCell>{ticket.reporter_email || 'Unknown'}</TableCell>
                              <TableCell>{formatDate(ticket.created_at)}</TableCell>
                              <TableCell>{ticket.due_date ? formatDate(ticket.due_date) : 'Not set'}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => toggleTicketExpanded(ticket.id)}
                                >
                                  {ticket.expanded ? "Collapse" : "Expand"}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {ticket.expanded && (
                              <TableRow>
                                <TableCell colSpan={7} className="p-0 border-b-0">
                                  <ExpandedTicketDetails ticket={ticket} />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                      <h3 className="text-lg font-medium">No Beta Testing Tickets Found</h3>
                      <p className="text-gray-500 mt-2">
                        There are currently no beta testing tickets in the system.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Statistics</CardTitle>
              <CardDescription>Overview of all job applications in the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Total Applications</p>
                          <p className="text-3xl font-bold">{stats.totalApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Pending</p>
                          <p className="text-3xl font-bold">{stats.pendingApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Accepted</p>
                          <p className="text-3xl font-bold">{stats.acceptedApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Withdrawn/Rejected</p>
                          <p className="text-3xl font-bold">{stats.withdrawnApplications + stats.rejectedApplications}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Pending', value: stats.pendingApplications },
                        { name: 'Accepted', value: stats.acceptedApplications },
                        { name: 'Withdrawn', value: stats.withdrawnApplications },
                        { name: 'Rejected', value: stats.rejectedApplications },
                      ]}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reply to Reporter</DialogTitle>
            <DialogDescription>
              Send a message to the person who reported this issue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                className="min-h-[150px]"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendReplyToReporter}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SweaquityDashboard;
