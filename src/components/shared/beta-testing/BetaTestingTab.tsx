
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KanbanBoard, BetaTicket } from "./KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";

interface BetaTestingTabProps {
  userType: "job_seeker" | "business";
  userId?: string;
  includeProjectTickets?: boolean;
}

export const BetaTestingTab = ({ userType, userId, includeProjectTickets = false }: BetaTestingTabProps) => {
  const [tickets, setTickets] = useState<BetaTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectTickets, setProjectTickets] = useState<BetaTicket[]>([]);
  const [showKanban, setShowKanban] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const [ticketStatistics, setTicketStatistics] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0
  });

  const createTicket = async () => {
    if (!userId) return;
    
    try {
      const { data: userData } = await supabase
        .from(userType === 'job_seeker' ? 'profiles' : 'businesses')
        .select('*')
        .eq('id', userId)
        .single();

      const userName = userType === 'job_seeker'
        ? `${userData.first_name} ${userData.last_name}`
        : userData.company_name;

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: `New feature request by ${userName}`,
          description: "I would like to request a new feature...",
          reporter: userId,
          status: 'new',
          priority: 'medium',
          health: 'green',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Test ticket created successfully!");
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create test ticket");
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      if (!userId) return;

      // Load beta testing tickets
      const { data: betaTickets, error: betaError } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`)
        .is('project_id', null);

      if (betaError) throw betaError;
      
      setTickets(betaTickets || []);
      calculateTicketStatistics(betaTickets);

      // Load project tickets if includeProjectTickets is true
      if (includeProjectTickets) {
        await loadProjectTickets();
      }
      
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const calculateTicketStatistics = (ticketData: Ticket[]) => {
    const totalTickets = ticketData.length;
    const openTickets = ticketData.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketData.filter(ticket => 
      ticket.priority === 'high'
    ).length;

    setTicketStatistics({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets
    });
  };

  const loadProjectTickets = async () => {
    try {
      if (!userId) return;

      let projectTicketsData: BetaTicket[] = [];

      if (userType === 'job_seeker') {
        // Find accepted projects for job seeker
        const { data: acceptedProjects, error: projectsError } = await supabase
          .from('job_applications')
          .select('project_id')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        if (projectsError) throw projectsError;

        if (acceptedProjects && acceptedProjects.length > 0) {
          const projectIds = acceptedProjects.map(p => p.project_id).filter(Boolean);
          
          if (projectIds.length > 0) {
            // Get tickets related to these projects
            const { data: projectTickets, error: ticketsError } = await supabase
              .from('tickets')
              .select('*')
              .in('project_id', projectIds);

            if (ticketsError) throw ticketsError;
            
            projectTicketsData = projectTickets || [];
          }
        }
      } else if (userType === 'business') {
        // Find business projects
        const { data: businessProjects, error: projectsError } = await supabase
          .from('business_projects')
          .select('project_id')
          .eq('business_id', userId);

        if (projectsError) throw projectsError;

        if (businessProjects && businessProjects.length > 0) {
          const projectIds = businessProjects.map(p => p.project_id);
          
          // Get tickets related to these projects
          const { data: projectTickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .in('project_id', projectIds);

          if (ticketsError) throw ticketsError;
          
          projectTicketsData = projectTickets || [];
        }
      }

      setProjectTickets(projectTicketsData);
      
    } catch (error) {
      console.error('Error loading project tickets:', error);
      toast.error("Failed to load project tickets");
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Ticket status updated");
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId]);

  const allTickets = [...tickets, ...projectTickets] as Ticket[];

  // Update handleRefreshData to return a Promise
  const handleRefreshData = async (): Promise<void> => {
    try {
      await loadTickets();
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing data:", error);
      return Promise.reject(error);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Projects</CardTitle>
              <CardDescription>View and manage your project tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowKanban(!showKanban)}
                size="sm"
              >
                {showKanban ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showKanban ? "Hide Kanban" : "Show Kanban"}
              </Button>
              <Button
                variant="outline" 
                onClick={() => setShowDashboard(!showDashboard)}
                size="sm"
              >
                {showDashboard ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
              </Button>
              <Button onClick={loadTickets}>Refresh</Button>
              <Button onClick={createTicket}>Create Test Ticket</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              Loading tickets...
            </div>
          ) : allTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tickets found.</p>
              <Button onClick={createTicket}>Create a test ticket</Button>
            </div>
          ) : (
            <>
              {!showDashboard ? (
                <>
                  <TicketStats
                    totalTickets={ticketStatistics.totalTickets}
                    openTickets={ticketStatistics.openTickets}
                    closedTickets={ticketStatistics.closedTickets}
                    highPriorityTickets={ticketStatistics.highPriorityTickets}
                  />
                  
                  {showKanban && (
                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const { draggableId, destination } = result;
                      
                      updateTicketStatus(draggableId, destination.droppableId);
                    }}>
                      <KanbanBoard 
                        tickets={allTickets} 
                        onStatusChange={updateTicketStatus}
                        onTicketClick={() => {}}
                      />
                    </DragDropContext>
                  )}
                </>
              ) : (
                <TicketDashboard
                  tickets={allTickets}
                  onRefresh={handleRefreshData}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
