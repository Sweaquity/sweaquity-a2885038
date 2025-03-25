
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
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
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
        // For job seeker, fetch projects they're involved in
        const { data, error } = await supabase
          .from('jobseeker_active_projects')
          .select('project_id, project_title')
          .eq('user_id', userId)
          .eq('application_status', 'accepted');
        
        if (error) throw error;
        
        // Create a unique list of projects
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
      
      // Find the right field to filter based on user type
      const userField = userType === 'business' ? 'reporter' : 'assigned_to';
      
      let query = supabase
        .from('tickets')
        .select('*');
      
      // Filter by user role
      query = query.or(`${userField}.eq.${userId},${userType === 'business' ? 'assigned_to' : 'reporter'}.eq.${userId}`);
      
      // Filter by project if one is selected
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        expanded: !!expandedTickets[ticket.id],
        description: ticket.description || "" // Ensure description exists
      }));
      
      setTickets(processedTickets);

      // Calculate ticket stats
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
      
      // Reload tickets to get updated data
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

  const handleToggleTicket = (ticketId: string, isExpanded: boolean) => {
    console.log("Toggle ticket:", ticketId, "expanded:", isExpanded);
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanded
    }));
    
    // Also update the tickets array
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
      )
    );
  };

  const handleCreateTicket = () => {
    // This would open a dialog to create a new ticket
    toast.info("Create ticket functionality will be implemented soon");
  };

  if (!userId) {
    return <div>Please log in to view tickets.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Beta Testing Dashboard</CardTitle>
          <div className="flex items-center gap-2">
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
            
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            
            {userType === 'business' && (
              <Button size="sm" onClick={handleCreateTicket}>
                <Plus className="h-4 w-4 mr-1" /> Create Ticket
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
                <div className="text-2xl font-bold mt-1">{taskStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Open Tasks</div>
                <div className="text-2xl font-bold mt-1">{taskStats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Closed Tasks</div>
                <div className="text-2xl font-bold mt-1">{taskStats.closed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
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
            </TabsList>
            
            <TabsContent value="tickets">
              <TicketDashboard 
                initialTickets={tickets}
                onRefresh={handleRefresh}
                onTicketAction={handleTicketAction}
                onToggleTicket={handleToggleTicket}
                showTimeTracking={userType === 'job_seeker'}
                userId={userId}
              />
            </TabsContent>
            
            {includeProjectTickets && (
              <>
                <TabsContent value="project-tasks">
                  <TicketDashboard 
                    initialTickets={tickets.filter(t => t.task_id)}
                    onRefresh={handleRefresh}
                    onTicketAction={handleTicketAction}
                    onToggleTicket={handleToggleTicket}
                    showTimeTracking={userType === 'job_seeker'}
                    userId={userId}
                  />
                </TabsContent>
                
                <TabsContent value="project-tickets">
                  <TicketDashboard 
                    initialTickets={tickets.filter(t => t.project_id && !t.task_id)}
                    onRefresh={handleRefresh}
                    onTicketAction={handleTicketAction}
                    onToggleTicket={handleToggleTicket}
                    showTimeTracking={userType === 'job_seeker'}
                    userId={userId}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
