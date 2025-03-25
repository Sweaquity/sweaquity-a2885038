
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateTicketDialog } from "@/components/ticket/CreateTicketDialog";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (userId) {
      loadUserProjects();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId, selectedProject]);

  const loadUserProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('business_projects')
        .select('*')
        .eq('business_id', userId);

      if (error) throw error;
      setProjects(projectsData || []);
      
      if (projectsData && projectsData.length > 0) {
        setSelectedProject(projectsData[0].project_id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tickets')
        .select('*')
        .or(`assigned_to.eq.${userId},reporter.eq.${userId}`);

      if (selectedProject && selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setTickets(data || []);
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
        case 'updatePriority':
        case 'updateDueDate':
        case 'updateCompletionPercentage':
        case 'addNote':
          const { error } = await supabase
            .from('tickets')
            .update({ [action.replace('update', '').toLowerCase()]: data })
            .eq('id', ticketId);

          if (error) throw error;
          loadTickets();
          toast.success(`${action.replace('update', '')} updated`);
          break;
          
        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error("Error handling ticket action:", error);
      toast.error("Failed to update ticket");
    }
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ...ticketData,
          reporter: userId,
          project_id: selectedProject
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Ticket created successfully");
      loadTickets();
      setIsCreateTicketOpen(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    switch (activeTab) {
      case 'project-tasks':
        return ticket.task_id != null;
      case 'project-tickets':
        return ticket.project_id != null && ticket.task_id == null;
      case 'beta-testing':
        return ticket.ticket_type === 'beta';
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Select 
              value={selectedProject || ''} 
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            size="sm"
            onClick={() => setIsCreateTicketOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Create Ticket
          </Button>
        </CardHeader>

        <CardContent>
          <TicketDashboard
            initialTickets={filteredTickets}
            onRefresh={loadTickets}
            onTicketAction={handleTicketAction}
            showTimeTracking={true}
            userId={userId}
            onTabChange={setActiveTab}
          />
        </CardContent>
      </Card>

      <CreateTicketDialog
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
        onSubmit={handleCreateTicket}
        projectId={selectedProject}
      />
    </div>
  );
};
