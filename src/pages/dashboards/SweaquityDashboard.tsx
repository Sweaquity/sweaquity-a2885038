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
import { Task, TaskType, KanbanColumn, DragResult, ApplicationStats } from "@/types/dashboard";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { TicketAttachment } from "@/components/ticket/TicketAttachment";

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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showKanban, setShowKanban] = useState(true);
  const [showGantt, setShowGantt] = useState(true);
  const [appStats, setAppStats] = useState<ApplicationStats>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalProjects: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    withdrawnApplications: 0,
    rejectedApplications: 0,
    openTasks: 0,
    completedTasks: 0
  });
  
  const [ticketStats, setTicketStats] = useState<StatisticsData>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });

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
      calculateTicketStatistics(betaTickets.map(ticket =>
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
      calculateTicketStatistics(betaTickets.map(ticket =>
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
      
      const { error: tableCheckError } = await supabase
        .from('user_messages')
        .select('id', { count: 'exact', head: true });
      
      if (tableCheckError) {
        const { error: createTableError } = await supabase.rpc('create_messages_table_if_not_exists');
        if (createTableError) {
          console.error("Error creating messages table:", createTableError);
          toast.error("Failed to send reply: messaging system not available");
          return;
        }
      }
      
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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchBetaTickets()
    ]);
    setIsLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      const fetchUsersCount = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
        
      const fetchBusinessesCount = supabase
        .from('businesses')
        .select('businesses_id', { count: 'exact', head: true });
        
      const fetchProjectsCount = supabase
        .from('business_projects')
        .select('project_id', { count: 'exact', head: true });
        
      const fetchApplicationsCount = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true });
        
      const fetchPendingApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      const fetchAcceptedApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'accepted');
        
      const fetchWithdrawnApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'withdrawn');
        
      const fetchRejectedApplications = supabase
        .from('job_applications')
        .select('job_app_id', { count: 'exact', head: true })
        .eq('status', 'rejected');
        
      const fetchOpenTasks = supabase
        .from('project_sub_tasks')
        .select('task_id', { count: 'exact', head: true })
        .eq('status', 'open');
        
      const fetchCompletedTasks = supabase
        .from('project_sub_tasks')
        .select('task_id', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      const [
        usersResult,
        businessesResult,
        projectsResult,
        applicationsResult,
        pendingAppsResult,
        acceptedAppsResult,
        withdrawnAppsResult,
        rejectedAppsResult,
        openTasksResult,
        completedTasksResult
      ] = await Promise.all([
        fetchUsersCount,
        fetchBusinessesCount,
        fetchProjectsCount,
        fetchApplicationsCount,
        fetchPendingApplications,
        fetchAcceptedApplications,
        fetchWithdrawnApplications,
        fetchRejectedApplications,
        fetchOpenTasks,
        fetchCompletedTasks
      ]);
      
      if (usersResult.error || businessesResult.error || projectsResult.error || applicationsResult.error) {
        throw new Error("Error fetching data");
      }
      
      setAppStats({
        totalUsers: usersResult.count || 0,
        totalBusinesses: businessesResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        pendingApplications: pendingAppsResult.count || 0,
        acceptedApplications: acceptedAppsResult.count || 0,
        withdrawnApplications: withdrawnAppsResult.count || 0,
        rejectedApplications: rejectedAppsResult.count || 0,
        openTasks: openTasksResult.count || 0,
        completedTasks: completedTasksResult.count || 0
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const fetchBetaTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });

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
          
          let attachments = ticket.attachments || [];
          if (attachments.length > 0) {
            console.log("Ticket attachments found:", attachments);
            
            if (!attachments[0].startsWith('http')) {
              attachments = attachments.map((url: string) => {
                let filePath = url;
                if (url.includes('ticket-attachments/')) {
                  filePath = url.split('ticket-attachments/')[1];
                }
                
                const { data: { publicUrl } } = supabase
                  .storage
                  .from('ticket-attachments')
                  .getPublicUrl(filePath);
                  
                console.log(`Converting ${url} to ${publicUrl}`);
                return publicUrl;
              });
            }
          }
          
          return {
            ...ticket,
            reporter_email: reporterEmail,
            expanded: false,
            newNote: '',
            attachments: attachments
          };
        })
      );

      setBetaTickets(processedTickets);
      calculateTicketStatistics(processedTickets);
    } catch (err) {
      console.error("Error in fetchBetaTickets:", err);
      toast.error("Failed to load beta tickets data");
    }
  };

  const calculateTicketStatistics = (tickets: BetaTicket[]) => {
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

  const handleRefreshData = async () => {
    setIsLoading(true);
    await fetchAllData();
    setIsLoading(false);
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setBetaTickets(prev => prev.map(ticket =>
      ticket.id === ticketId ? { ...ticket, expanded: !ticket.expanded } : ticket
    ));
  };

  const getKanbanTickets = () => {
    const columns = {
      'new': { id: 'new', title: 'New', ticketIds: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', ticketIds: [] },
      'blocked': { id: 'blocked', title: 'Blocked', ticketIds: [] },
      'review': { id: 'review', title: 'Review', ticketIds: [] },
      'done': { id: 'done', title: 'Done', ticketIds: [] },
      'closed': { id: 'closed', title: 'Closed', ticketIds: [] }
    };
    
    const ticketMap: Record<string, BetaTicket> = {};
    
    betaTickets.forEach(ticket => {
      ticketMap[ticket.id] = ticket;
      const status = ticket.status || 'new';
      if (columns[status as keyof typeof columns]) {
        columns[status as keyof typeof columns].ticketIds.push(ticket.id);
      } else {
        columns['new'].ticketIds.push(ticket.id);
      }
    });
    
    return { columns, tickets: ticketMap };
  };

  const getGanttTasks = () => {
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
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className="p-2 bg-blue-50 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const KanbanBoard = () => {
    const { columns, tickets } = getKanbanTickets();
    
    const onDragEnd = (result: DragResult) => {
      const { source, destination, draggableId } = result;
      
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;
      
      handleUpdateTicketStatus(draggableId, destination.droppableId);
    };
    
    return (
      <div className="overflow-x-auto p-4">
        <div className="flex space-x-4 min-w-fit">
          {Object.values(columns).map(column => (
            <div key={column.id} className="w-64 bg-gray-50 rounded-md p-2">
              <h3 className="font-medium mb-2">{column.title} ({column.ticketIds.length})</h3>
              <div className="space-y-2">
                {column.ticketIds.map((ticketId) => {
                  const ticket = tickets[ticketId];
                  return (
                    <Card key={ticketId} className={`
                      p-2 cursor-pointer
                      ${ticket.priority === 'high' ? 'border-l-4 border-l-red-500' : 
                        ticket.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-blue-500'}`
                    }>
                      <div className="text-sm font-medium">{ticket.title}</div>
                      <div className="text-xs text-gray-500 truncate">{ticket.description}</div>
                      <div className="flex justify-between mt-1">
                        <div className="text-xs">{formatDate(ticket.due_date || '')}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => toggleTicketExpanded(ticket.id)}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
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
          
          {(ticket.ticket_type === 'beta_testing' || ticket.attachments) && (
            <div>
              <TicketAttachment 
                attachments={ticket.attachments || []} 
                ticketId={ticket.id}
                projectId={ticket.project_id}
                businessId={ticket.reporter}
              />
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
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sweaquity Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform management and beta testing</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Platform Overview</TabsTrigger>
          <TabsTrigger value="tickets">Beta Testing</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Users" 
              value={appStats.totalUsers} 
              icon={<Users className="h-8 w-8 text-blue-500" />}
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Businesses" 
              value={appStats.totalBusinesses} 
              icon={<Building className="h-8 w-8 text-green-500" />}
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Projects" 
              value={appStats.totalProjects} 
              icon={<FileText className="h-8 w-8 text-purple-500" />}
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Applications" 
              value={appStats.totalApplications}
              icon={<Briefcase className="h-8 w-8 text-yellow-500" />}
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Applications',
                          pending: appStats.pendingApplications,
                          accepted: appStats.acceptedApplications,
                          rejected: appStats.rejectedApplications,
                          withdrawn: appStats.withdrawnApplications
                        }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
                      <Bar dataKey="accepted" name="Accepted" fill="#10b981" />
                      <Bar dataKey="rejected" name="Rejected" fill="#ef4444" />
                      <Bar dataKey="withdrawn" name="Withdrawn" fill="#6b7280" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Tasks',
                          open: appStats.openTasks,
                          completed: appStats.completedTasks
                        }
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="open" name="Open" fill="#3b82f6" />
                      <Bar dataKey="completed" name="Completed" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                  <p className="text-3xl font-bold">{ticketStats.totalTickets}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                  <p className="text-3xl font-bold text-blue-500">{ticketStats.openTickets}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-500">Closed Tickets</p>
                  <p className="text-3xl font-bold text-green-500">{ticketStats.closedTickets}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-500">High Priority</p>
                  <p className="text-3xl font-bold text-red-500">{ticketStats.highPriorityTickets}</p>
                </div>
              </Card>
            </Card>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={showKanban ? "default" : "outline"}
              size="sm"
              onClick={() => setShowKanban(!showKanban)}
            >
              {showKanban ? "Hide" : "Show"} Kanban Board
            </Button>
            <Button
              variant={showGantt ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGantt(!showGantt)}
            >
              {showGantt ? "Hide" : "Show"} Gantt Chart
            </Button>
          </div>
          
          {showKanban && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Kanban Board</CardTitle>
                <CardDescription>Drag and drop tickets to change their status</CardDescription>
              </CardHeader>
              <CardContent>
                {betaTickets.length > 0 ? (
                  <KanbanBoard />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No beta testing tickets available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {showGantt && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>Visualize ticket timelines</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {betaTickets.length > 0 ? (
                  <GanttChartView tasks={getGanttTasks()} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No beta testing tickets available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Beta Testing Tickets</CardTitle>
                <CardDescription>Manage and respond to beta testing tickets</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshData}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              {betaTickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {betaTickets.map(ticket => (
                      <React.Fragment key={ticket.id}>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[400px]">
                              {ticket.description?.substring(0, 100)}
                              {ticket.description?.length > 100 ? '...' : ''}
                            </div>
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {ticket.attachments.length} attachment{ticket.attachments.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                ticket.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                ticket.status === 'review' ? 'bg-purple-100 text-purple-800' :
                                ticket.status === 'done' || ticket.status === 'closed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`
                            }>
                              {ticket.status}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`
                            }>
                              {ticket.priority}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(ticket.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTicketExpanded(ticket.id)}
                            >
                              {ticket.expanded ? 'Hide Details' : 'View Details'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {ticket.expanded && (
                          <TableRow>
                            <TableCell colSpan={5}>
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
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No beta testing tickets found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="applications">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Application management will be implemented soon.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Reporter</DialogTitle>
            <DialogDescription>
              Your message will be sent to the reporter's dashboard and recorded in the ticket history.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Enter your reply message..."
            className="min-h-[150px]"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
          />
          
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
