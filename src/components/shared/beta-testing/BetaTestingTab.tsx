
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ticket } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus } from "lucide-react";

interface BetaTestingTabProps {
  userType: 'business' | 'job_seeker';
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab = ({ 
  userType, 
  userId, 
  includeProjectTickets = false 
}: BetaTestingTabProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });

  useEffect(() => {
    if (userId) {
      fetchProjects(userId);
    }
  }, [userId, userType]);

  useEffect(() => {
    if (userId && selectedProject) {
      loadTickets(userId);
    } else if (userId) {
      loadTickets(userId);
    }
  }, [userId, selectedProject]);

  const fetchProjects = async (userId: string) => {
    try {
      if (userType === 'business') {
        const { data, error } = await supabase
          .from('business_projects')
          .select('project_id, title')
          .eq('business_id', userId);
        
        if (error) throw error;
        setProjects(data || []);
        
        if (data && data.length > 0) {
          setSelectedProject(data[0].project_id);
        }
      } else {
        const { data, error } = await supabase
          .from('jobseeker_active_projects')
          .select('project_id, project_title')
          .eq('user_id', userId)
          .eq('application_status', 'accepted');
        
        if (error) throw error;
        
        const uniqueProjects = Array.from(
          new Map(data?.map(item => [item.project_id, { 
            project_id: item.project_id, 
            title: item.project_title 
          }]) || []).values()
        );
        
        setProjects(uniqueProjects);
        
        if (uniqueProjects.length > 0) {
          setSelectedProject(uniqueProjects[0].project_id);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async (userId: string) => {
    try {
      setLoading(true);
      
      const userField = userType === 'business' ? 'reporter' : 'assigned_to';
      
      let query = supabase
        .from('tickets')
        .select('*');
      
      query = query.or(`${userField}.eq.${userId},${userType === 'business' ? 'assigned_to' : 'reporter'}.eq.${userId}`);
      
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        expanded: !!expandedTickets.has(ticket.id),
        description: ticket.description || ""
      }));
      
      setTickets(processedTickets);

      const stats = {
        total: processedTickets.length,
        open: processedTickets.filter(t => t.status !== 'done' && t.status !== 'closed').length,
        closed: processedTickets.filter(t => t.status === 'done' || t.status === 'closed').length,
        highPriority: processedTickets.filter(t => t.priority === 'high').length
      };
      
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus':
          await supabase
            .from('tickets')
            .update({ status: data })
            .eq('id', ticketId);
          
          toast.success("Status updated");
          break;
        
        case 'updatePriority':
          await supabase
            .from('tickets')
            .update({ priority: data })
            .eq('id', ticketId);
          
          toast.success("Priority updated");
          break;
        
        case 'updateDueDate':
          await supabase
            .from('tickets')
            .update({ due_date: data })
            .eq('id', ticketId);
          
          toast.success("Due date updated");
          break;
        
        case 'addNote':
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
          
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : 
            'User';
          
          const newNote = {
            id: Date.now().toString(),
            user: userName,
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          await supabase
            .from('tickets')
            .update({ notes: updatedNotes })
            .eq('id', ticketId);
          
          toast.success("Note added");
          break;
        
        default:
          console.warn("Unknown action:", action);
      }
      
      if (userId) {
        await loadTickets(userId);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleRefresh = () => {
    if (userId) {
      loadTickets(userId);
    }
  };

  const handleToggleTicket = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleCreateTicket = () => {
    toast.info("Create ticket functionality will be implemented soon");
  };

  if (!userId) {
    return <div>Please log in to view tickets.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <p className="text-muted-foreground">View and manage your project tasks</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Select value={selectedProject || "none"} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.length === 0 ? (
              <SelectItem value="none">No projects available</SelectItem>
            ) : (
              projects.map(project => (
                <SelectItem key={project.project_id} value={project.project_id}>
                  {project.title || project.project_title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          
          <Button size="sm" onClick={handleCreateTicket}>
            <Plus className="h-4 w-4 mr-1" /> Create Ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">All Tickets</div>
            <div className="text-2xl font-bold mt-1">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">Open Tasks</div>
            <div className="text-2xl font-bold mt-1">{taskStats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">Closed Tasks</div>
            <div className="text-2xl font-bold mt-1">{taskStats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">High Priority</div>
            <div className="text-2xl font-bold mt-1">{taskStats.highPriority}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          {includeProjectTickets && (
            <>
              <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
              <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
            </>
          )}
          <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets">
          <TicketDashboard 
            initialTickets={tickets.filter(t => 
              t.ticket_type === "beta_testing" || 
              t.ticket_type === "beta-test" || 
              t.ticket_type === "beta-testing"
            )}
            onRefresh={handleRefresh}
            onTicketAction={handleTicketAction}
            showTimeTracking={userType === 'job_seeker'}
            userId={userId}
            expandedTickets={expandedTickets}
            toggleTicketExpansion={handleToggleTicket}
          />
        </TabsContent>
        
        {includeProjectTickets && (
          <>
            <TabsContent value="project-tasks">
              <TicketDashboard 
                initialTickets={tickets.filter(t => t.task_id)}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
                showTimeTracking={userType === 'job_seeker'}
                userId={userId}
                expandedTickets={expandedTickets}
                toggleTicketExpansion={handleToggleTicket}
              />
            </TabsContent>
            
            <TabsContent value="project-tickets">
              <TicketDashboard 
                initialTickets={tickets.filter(t => t.project_id && !t.task_id)}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
                showTimeTracking={userType === 'job_seeker'}
                userId={userId}
                expandedTickets={expandedTickets}
                toggleTicketExpansion={handleToggleTicket}
              />
            </TabsContent>
          </>
        )}
        
        <TabsContent value="beta-tickets">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Beta Testing Features</h3>
              <p className="text-muted-foreground mb-4">
                This section will allow you to test new features before they are released.
              </p>
              <Button variant="outline">Join Beta Program</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const LiveProjectsTab = BetaTestingTab;
