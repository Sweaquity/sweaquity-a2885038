
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { GanttChartView } from "@/components/business/testing/GanttChartView";

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
  const [betaTickets, setBetaTickets] = useState<BetaTicket[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBetaTickets();
  }, []);

  const fetchBetaTickets = async () => {
    try {
      setLoading(true);
      
      // First fetch tickets without the profiles join
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

      // Then get the reporter emails separately
      const processedTickets = await Promise.all(
        data.map(async (ticket) => {
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
            reporter_email: reporterEmail
          };
        })
      );

      setBetaTickets(processedTickets);
      calculateStatistics(processedTickets);
    } catch (err) {
      console.error("Error in fetchBetaTickets:", err);
      toast.error("Failed to load beta tickets data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (tickets: BetaTicket[]) => {
    const stats: StatisticsData = {
      totalTickets: tickets.length,
      openTickets: 0,
      closedTickets: 0,
      highPriorityTickets: 0,
      byStatus: {},
      byPriority: {}
    };

    tickets.forEach(ticket => {
      // Count by status
      if (ticket.status === 'done' || ticket.status === 'closed') {
        stats.closedTickets++;
      } else {
        stats.openTickets++;
      }

      // Count by priority
      if (ticket.priority === 'high') {
        stats.highPriorityTickets++;
      }

      // Aggregate by status
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;

      // Aggregate by priority
      stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
    });

    setStatistics(stats);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sweaquity Dashboard</h1>
          <p className="text-muted-foreground">Beta testing and platform management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Tickets</CardTitle>
            <CardDescription>All beta and testing tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{statistics.totalTickets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Open Tickets</CardTitle>
            <CardDescription>Tickets awaiting action</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{statistics.openTickets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Closed Tickets</CardTitle>
            <CardDescription>Completed tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{statistics.closedTickets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>High Priority</CardTitle>
            <CardDescription>Urgent tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{statistics.highPriorityTickets}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tickets">Tickets List</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Gantt chart of beta testing tickets</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              {!loading && betaTickets.length > 0 ? (
                <GanttChartView tickets={betaTickets.map(ticket => ({
                  id: ticket.id,
                  title: ticket.title,
                  start: new Date(ticket.created_at),
                  end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 14)),
                  status: ticket.status,
                  priority: ticket.priority,
                  progress: ticket.status === 'done' ? 100 : ticket.status === 'in-progress' ? 50 : 0,
                  type: 'task',
                  project: 'Beta Testing'
                }))} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  {loading ? "Loading timeline..." : "No beta tickets found"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Beta Testing Tickets</CardTitle>
              <CardDescription>All beta and testing related tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading tickets...</div>
              ) : betaTickets.length === 0 ? (
                <div className="text-center py-4">No beta tickets found</div>
              ) : (
                <div className="space-y-4">
                  {betaTickets.map(ticket => (
                    <div key={ticket.id} className="border p-4 rounded-lg">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{ticket.title}</h3>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' : 
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.status === 'done' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2">{ticket.description}</p>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SweaquityDashboard;
