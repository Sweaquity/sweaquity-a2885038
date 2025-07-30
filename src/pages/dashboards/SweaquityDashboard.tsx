import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign, AlertTriangle, CheckCircle, Clock, Image } from "lucide-react";
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
import { TicketAttachmentsList } from "@/components/dashboard/TicketAttachmentsList";

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
          
          return {
            ...ticket,
            reporter_email: reporterEmail,
            expanded: false,
            newNote: ''
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
    const [activeTab, setActiveTab] = useState("details");
    const [hasAttachments, setHasAttachments] = useState(false);
    const [isCheckingAttachments, setIsCheckingAttachments] = useState(true);

    useEffect(() => {
      const checkAttachments = async () => {
        if (ticket.reporter && ticket.id) {
          setIsCheckingAttachments(true);
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              console.error("Not authenticated");
              setHasAttachments(false);
              setIsCheckingAttachments(false);
              return;
            }
            
            console.log(`Checking attachments for ticket: Reporter ID=${ticket.reporter}, Ticket ID=${ticket.id}`);
            
            const { data, error } = await supabase.storage
              .from('ticket-attachments')
              .list(`${ticket.reporter}/${ticket.id}`);
            
            if (error) {
              console.error("Error checking attachments:", error);
              setHasAttachments(false);
            } else {
              console.log("Attachments found:", data);
              setHasAttachments(data && data.length > 0);
            }
          } catch (err) {
            console.error("Error in checkAttachments:", err);
            setHasAttachments(false);
          } finally {
            setIsCheckingAttachments(false);
          }
        } else {
          setHasAttachments(false);
          setIsCheckingAttachments(false);
        }
      };
      
      checkAttachments();
    }, [ticket.id, ticket.reporter]);
    
    const handleAttachmentsLoaded = (hasFiles: boolean) => {
      setHasAttachments(hasFiles);
    };

    return (
      <div className="p-4 border-t">
        <div className="border-b mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-2">
              <TabsTrigger value="details">Details</TabsTrigger>
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
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <TabsContent value="details" className="mt-0">
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
        </TabsContent>

        <TabsContent value="attachments" className="mt-0">
          <TicketAttachmentsList 
            reporterId={ticket.reporter} 
            ticketId={ticket.id} 
            onAttachmentsLoaded={handleAttachmentsLoaded}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
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
        </TabsContent>
        
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
              icon={<Building className="h-8 w-8 text-purple-500" />} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Projects" 
              value={appStats.totalProjects} 
              icon={<Briefcase className="h-8 w-8 text-green-500" />} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Total Applications" 
              value={appStats.totalApplications} 
              icon={<FileText className="h-8 w-8 text-amber-500" />} 
              isLoading={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Current distribution of job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Pending', value: appStats.pendingApplications },
                    { name: 'Accepted', value: appStats.acceptedApplications },
                    { name: 'Withdrawn', value: appStats.withdrawnApplications },
                    { name: 'Rejected', value: appStats.rejectedApplications }
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Completion</CardTitle>
                <CardDescription>Progress on project tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Open Tasks', value: appStats.openTasks },
                    { name: 'Completed Tasks', value: appStats.completedTasks }
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
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
                    onClick={() => setShowGantt(!showGantt)}
                  >
                    {showGantt ? "Hide" : "Show"} Gantt Chart
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
                      <p className="text-2xl font-bold">{ticketStats.totalTickets}</p>
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
                      <p className="text-2xl font-bold">{ticketStats.openTickets}</p>
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
                      <p className="text-2xl font-bold">{ticketStats.closedTickets}</p>
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
                      <p className="text-2xl font-bold">{ticketStats.highPriorityTickets}</p>
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
                  <div className="border rounded-lg overflow-hidden">
                    <DragDropContext onDragEnd={(result) => {
                      const kanban = KanbanBoard();
                      return kanban.props.onDragEnd(result);
                    }}>
                      <KanbanBoard />
                    </DragDropContext>
                  </div>
                </div>
              )}
              
              {showGantt && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Timeline</h3>
                  <div className="border rounded-lg overflow-hidden p-4">
                    <GanttChartView tasks={getGanttTasks()} />
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
                    {betaTickets.map(ticket => (
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
                              <ExpandedTicketDetails ticket={ticket} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <AdminTicketManager />
        </TabsContent>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Management</CardTitle>
              <CardDescription>Manage job applications across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-8">This section is under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
};

export default SweaquityDashboard;
