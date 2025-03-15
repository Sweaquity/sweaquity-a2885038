import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, FileText, Briefcase, CircleDollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChartView } from "@/components/business/testing/GanttChartView";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeTracker } from "@/components/business/testing/TimeTracker";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  health: string;
  reporter: string;
  reporter_email?: string;
  created_at: string;
  updated_at: string;
}

const SweaquityDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
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
  const [betaTickets, setBetaTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [ticketComments, setTicketComments] = useState<any[]>([]);
  const [ticketStatus, setTicketStatus] = useState('');
  
  useEffect(() => {
    fetchBetaTickets();
  }, []);

  const fetchBetaTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:reporter(email)
        `)
        .or('title.ilike.%Beta%,description.ilike.%Beta%,title.ilike.%Testing%')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const processedTickets = data.map((ticket: any) => ({
        ...ticket,
        reporter_email: ticket.profiles?.email || 'Unknown'
      }));
      
      setBetaTickets(processedTickets);
    } catch (error) {
      console.error("Error fetching beta tickets:", error);
      toast.error("Failed to load beta test tickets");
    }
  };
  
  const fetchTicketComments = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:user_id(email, first_name, last_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setTicketComments(data);
    } catch (error) {
      console.error("Error fetching ticket comments:", error);
      toast.error("Failed to load ticket comments");
    }
  };
  
  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    await fetchTicketComments(ticket.id);
  };
  
  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', selectedTicket.id);
        
      if (error) throw error;
      
      setTicketStatus(status);
      setSelectedTicket({ ...selectedTicket, status });
      toast.success("Ticket status updated");
      
      fetchBetaTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };
  
  const handleReplySubmit = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to reply to tickets");
        return;
      }
      
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          content: replyContent
        });
        
      if (error) throw error;
      
      setReplyContent('');
      fetchTicketComments(selectedTicket.id);
      toast.success("Reply added successfully");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };
  
  const handleRefreshData = () => {
    fetchBetaTickets();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sweaquity Admin Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefreshData}>
          Refresh Data
        </Button>
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="tickets">
          <TabsList>
            <TabsTrigger value="tickets">Beta Test Tickets</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Beta Test Issues</CardTitle>
                  <CardDescription>Tickets reported by beta testers</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  ) : betaTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No beta test tickets found</p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {betaTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className={`p-3 border rounded-md cursor-pointer hover:bg-accent/30 transition-colors ${
                            selectedTicket?.id === ticket.id ? 'bg-accent/50 border-accent' : ''
                          }`}
                          onClick={() => handleTicketSelect(ticket)}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium truncate">{ticket.title}</h4>
                            <div 
                              className={`w-3 h-3 rounded-full ml-2 flex-shrink-0 ${
                                ticket.health === 'red' ? 'bg-red-500' : 
                                ticket.health === 'amber' ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`} 
                            />
                          </div>
                          <div className="flex mt-1 justify-between text-xs text-muted-foreground">
                            <span>
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            <span className={`
                              ${ticket.status === 'new' ? 'text-blue-500' : 
                                ticket.status === 'in-progress' ? 'text-yellow-500' : 
                                ticket.status === 'done' ? 'text-green-500' : 
                                'text-muted-foreground'}
                            `}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                  {selectedTicket && (
                    <div className="flex justify-between items-center">
                      <CardDescription>
                        Reported by: {selectedTicket.reporter_email}
                      </CardDescription>
                      <Select value={ticketStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="needs-info">Needs Info</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!selectedTicket ? (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-md">
                      <p className="text-muted-foreground">Select a ticket to view details</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                        
                        <div className="mt-4 flex gap-2">
                          <div className="rounded px-2 py-1 text-xs bg-secondary">
                            Priority: {selectedTicket.priority}
                          </div>
                          <div className="rounded px-2 py-1 text-xs bg-secondary">
                            Created: {new Date(selectedTicket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {selectedTicket && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Time Tracking</h4>
                          <TimeTracker ticketId={selectedTicket.id} userId={""} />
                        </div>
                      )}
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-4">Discussion</h4>
                        
                        <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                          {ticketComments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No comments yet</p>
                          ) : (
                            ticketComments.map(comment => (
                              <div key={comment.id} className="border rounded-md p-3 bg-accent/10">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">
                                    {comment.profiles?.first_name || 'User'} {comment.profiles?.last_name || ''}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm whitespace-pre-wrap">
                                  {comment.content}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="pt-2">
                          <Textarea
                            placeholder="Add a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end mt-2">
                            <Button onClick={handleReplySubmit} disabled={!replyContent.trim()}>
                              Send Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="gantt" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline (Gantt Chart)</CardTitle>
                <CardDescription>Visual timeline of all beta tickets and issues</CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChartView projectId={null} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers} 
                icon={<Users className="h-8 w-8 text-blue-500" />} 
                isLoading={isLoading}
              />
              <StatCard 
                title="Total Businesses" 
                value={stats.totalBusinesses} 
                icon={<Building className="h-8 w-8 text-purple-500" />} 
                isLoading={isLoading}
              />
              <StatCard 
                title="Total Projects" 
                value={stats.totalProjects} 
                icon={<Briefcase className="h-8 w-8 text-green-500" />} 
                isLoading={isLoading}
              />
              <StatCard 
                title="Total Applications" 
                value={stats.totalApplications} 
                icon={<FileText className="h-8 w-8 text-amber-500" />} 
                isLoading={isLoading}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon, 
  isLoading 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  isLoading: boolean 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SweaquityDashboard;
