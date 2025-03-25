
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ticket } from "@/types/types";
import { BetaTestingTab } from "@/components/shared/beta-testing/BetaTestingTab";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all-tickets");

  // Load tickets and projects when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      loadUserTickets(userId);
      loadUserProjects(userId);
    }
  }, [userId]);

  // Update filtered tickets when selection changes
  useEffect(() => {
    if (tickets.length > 0) {
      let filtered = [...tickets];
      
      // Filter by project if one is selected
      if (selectedProject) {
        filtered = filtered.filter(ticket => ticket.project_id === selectedProject);
      }
      
      // Apply tab-specific filters
      if (activeTab === "project-tasks") {
        filtered = filtered.filter(ticket => ticket.task_id);
      } else if (activeTab === "project-tickets") {
        filtered = filtered.filter(ticket => ticket.project_id && !task_id);
      }
      
      setFilteredTickets(filtered);
    }
  }, [tickets, selectedProject, activeTab]);

  const loadUserTickets = async (userId: string) => {
    try {
      setLoading(true);
      
      // First, get all job applications where this user is accepted
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('job_app_id, task_id, project_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');
      
      if (appError) throw appError;
      
      if (!applications || applications.length === 0) {
        setLoading(false);
        setTickets([]);
        return;
      }
      
      // Get the tickets related to these applications
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*, notes')
        .or(`assigned_to.eq.${userId},reporter.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (ticketsError) throw ticketsError;
      
      // Add task_id to tickets from job applications if available
      const ticketsWithMetadata = (ticketsData || []).map(ticket => {
        const application = applications.find(app => app.job_app_id === ticket.job_app_id);
        const isTaskTicket = !!application?.task_id;
        const isProjectTicket = !!application?.project_id;
        
        return {
          ...ticket,
          task_id: application?.task_id || ticket.task_id,
          isTaskTicket,
          isProjectTicket,
          expanded: !!expandedTickets[ticket.id],
          description: ticket.description || "" // Ensure description exists
        };
      });
      
      console.log("Loaded tickets:", ticketsWithMetadata);
      setTickets(ticketsWithMetadata);
      setFilteredTickets(ticketsWithMetadata);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadUserProjects = async (userId: string) => {
    try {
      // Get all projects where this user has accepted job applications
      const { data, error } = await supabase
        .from('jobseeker_active_projects')
        .select('project_id, project_title')
        .eq('user_id', userId)
        .eq('application_status', 'accepted');
      
      if (error) throw error;
      
      // Create a unique list of projects
      const uniqueProjects = Array.from(
        new Map(data?.map(item => [item.project_id, item]) || []).values()
      );
      
      setProjects(uniqueProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any) => {
    try {
      console.log(`Performing ${action} on ticket ${ticketId} with data:`, data);
      
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
        await loadUserTickets(userId);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleRefresh = useCallback(() => {
    if (userId) {
      loadUserTickets(userId);
      loadUserProjects(userId);
    }
  }, [userId]);

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
    setFilteredTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, expanded: isExpanded } : ticket
      )
    );
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (!userId) {
    return <div>Please log in to view your active projects.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Project Tickets</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedProject || "all"} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.project_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="project-tasks">Project Tasks</TabsTrigger>
              <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
              <TabsTrigger value="beta-tickets">Beta Testing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-tickets">
              {loading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : (
                <TicketDashboard 
                  initialTickets={filteredTickets}
                  onRefresh={handleRefresh}
                  onTicketAction={handleTicketAction}
                  onToggleTicket={handleToggleTicket}
                  showTimeTracking={true}
                  userId={userId}
                />
              )}
            </TabsContent>
            
            <TabsContent value="project-tasks">
              {loading ? (
                <div className="text-center py-8">Loading project tasks...</div>
              ) : (
                <TicketDashboard 
                  initialTickets={filteredTickets}
                  onRefresh={handleRefresh}
                  onTicketAction={handleTicketAction}
                  onToggleTicket={handleToggleTicket}
                  showTimeTracking={true}
                  userId={userId}
                />
              )}
            </TabsContent>
            
            <TabsContent value="project-tickets">
              {loading ? (
                <div className="text-center py-8">Loading project tickets...</div>
              ) : (
                <TicketDashboard 
                  initialTickets={filteredTickets}
                  onRefresh={handleRefresh}
                  onTicketAction={handleTicketAction}
                  onToggleTicket={handleToggleTicket}
                  showTimeTracking={true}
                  userId={userId}
                />
              )}
            </TabsContent>
            
            <TabsContent value="beta-tickets">
              <BetaTestingTab 
                userType="job_seeker" 
                userId={userId} 
                includeProjectTickets={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
