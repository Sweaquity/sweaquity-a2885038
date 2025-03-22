
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KanbanBoard, BetaTicket } from "./KanbanBoard";
import { DragDropContext } from "react-beautiful-dnd";
import { toast } from "sonner";
import { Eye, EyeOff, Clock, Plus } from "lucide-react";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GanttChart, convertItemsToGanttTasks } from "@/components/ticket/GanttChart";

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
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGanttChart, setShowGanttChart] = useState(false);
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [hours, setHours] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
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

  const handleLogTime = async () => {
    if (!selectedTicketId || hours <= 0) return;
    
    try {
      // Create the time entry with the selected ticket ID
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ticket_id: selectedTicketId,
          user_id: userId,
          description: description,
          start_time: new Date().toISOString(),
          end_time: new Date(new Date().getTime() + hours * 60 * 60 * 1000).toISOString(),
          hours_logged: hours
        });
      
      if (error) {
        console.error("Error inserting time entry:", error);
        throw error;
      }
      
      toast.success("Time logged successfully");
      setIsTimeLogDialogOpen(false);
      setHours(0);
      setDescription('');
      loadTickets();
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to log time");
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSelectedTicketId(ticket.id);
  };

  const handleTimeLogClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsTimeLogDialogOpen(true);
  };

  useEffect(() => {
    if (userId) {
      loadTickets();
    }
  }, [userId]);

  const allTickets = [...tickets, ...projectTickets] as Ticket[];

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
                onClick={() => setShowGanttChart(!showGanttChart)}
                size="sm"
              >
                {showGanttChart ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showGanttChart ? "Hide Gantt" : "Show Gantt"}
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
            <div className="space-y-6">
              <TicketStats
                totalTickets={ticketStatistics.totalTickets}
                openTickets={ticketStatistics.openTickets}
                closedTickets={ticketStatistics.closedTickets}
                highPriorityTickets={ticketStatistics.highPriorityTickets}
              />
              
              {showKanban && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Kanban Board</h3>
                  <DragDropContext onDragEnd={(result) => {
                    if (!result.destination) return;
                    const { draggableId, destination } = result;
                    
                    updateTicketStatus(draggableId, destination.droppableId);
                  }}>
                    <KanbanBoard 
                      tickets={allTickets} 
                      onStatusChange={updateTicketStatus}
                      onTicketClick={handleTicketClick}
                    />
                  </DragDropContext>
                </div>
              )}
              
              {showGanttChart && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Gantt Chart</h3>
                  <GanttChart tasks={convertItemsToGanttTasks(allTickets)} />
                </div>
              )}
              
              {showDashboard && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Ticket Dashboard</h3>
                  <TicketDashboard
                    initialTickets={allTickets}
                    onRefresh={loadTickets}
                  />
                </div>
              )}
              
              {userType === 'job_seeker' && !showDashboard && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-4">Time Logging</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allTickets.map(ticket => (
                      <Card key={ticket.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-base">{ticket.title}</CardTitle>
                            <Badge variant={
                              ticket.priority === 'high' ? 'destructive' :
                              ticket.priority === 'medium' ? 'warning' : 'secondary'
                            }>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {ticket.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTicketClick(ticket)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTimeLogClick(ticket.id)}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Log Time
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Time logging dialog */}
      <Dialog open={isTimeLogDialogOpen} onOpenChange={setIsTimeLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time for Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                min="0.5"
                step="0.5"
                value={hours || ''}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description of Work</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you accomplished during this time"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeLogDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogTime} disabled={hours <= 0 || !description.trim()}>
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
