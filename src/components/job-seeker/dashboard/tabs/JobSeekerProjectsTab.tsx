
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TicketDashboard } from "@/components/ticket/TicketDashboard";
import { Ticket } from "@/types/types";
import TicketStats from "@/components/ticket/TicketStats";
import { TimeTracker } from "@/components/job-seeker/dashboard/TimeTracker";
import { Loader2 } from "lucide-react";

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    highPriorityTickets: 0,
    byStatus: {},
    byPriority: {}
  });
  const [activeTab, setActiveTab] = useState("all-tickets");
  const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

  // Load all tickets for the job seeker
  const loadAllTickets = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 1. First load beta testing tickets reported by the user
      const { data: betaTickets, error: betaError } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId}`)
        .is('project_id', null);

      if (betaError) throw betaError;
      
      const betaTicketsWithMeta = (betaTickets || []).map(ticket => ({
        ...ticket,
        expanded: expandedTickets[ticket.id] || false,
        isProjectTicket: false,
        isTaskTicket: false
      }));
      
      // 2. Load project-related tickets from accepted jobs
      const { data: acceptedJobs, error: acceptedJobsError } = await supabase
        .from('accepted_jobs')
        .select(`
          job_app_id,
          equity_agreed,
          job_applications (
            task_id,
            project_id,
            user_id
          )
        `)
        .eq('job_applications.user_id', userId);

      if (acceptedJobsError) throw acceptedJobsError;
      
      let projectTickets: Ticket[] = [];
      
      if (acceptedJobs && acceptedJobs.length > 0) {
        const projectIds = acceptedJobs
          .filter(job => job.job_applications && job.job_applications.project_id)
          .map(job => job.job_applications.project_id);
          
        const taskIds = acceptedJobs
          .filter(job => job.job_applications && job.job_applications.task_id)
          .map(job => job.job_applications.task_id);
        
        // Load project descriptions
        const taskDescriptions: Record<string, string> = {};
        if (taskIds.length > 0) {
          const { data: taskDetails } = await supabase
            .from('project_sub_tasks')
            .select('task_id, description')
            .in('task_id', taskIds);
            
          if (taskDetails) {
            taskDetails.forEach(task => {
              taskDescriptions[task.task_id] = task.description || '';
            });
          }
        }
        
        // Load project tickets
        if (projectIds.length > 0) {
          const { data: pTickets } = await supabase
            .from('tickets')
            .select('*')
            .in('project_id', projectIds);
            
          if (pTickets) {
            projectTickets = [
              ...projectTickets,
              ...(pTickets.map(ticket => ({
                ...ticket,
                expanded: expandedTickets[ticket.id] || false,
                isProjectTicket: true,
                isTaskTicket: false
              })))
            ];
          }
        }
        
        // Load task tickets
        if (taskIds.length > 0) {
          const { data: tTickets } = await supabase
            .from('tickets')
            .select('*')
            .in('task_id', taskIds);
            
          if (tTickets) {
            projectTickets = [
              ...projectTickets,
              ...(tTickets.map(ticket => ({
                ...ticket,
                expanded: expandedTickets[ticket.id] || false,
                isProjectTicket: true,
                isTaskTicket: true,
                description: taskDescriptions[ticket.task_id || ''] || ticket.description || ''
              })))
            ];
          }
        }
      }
      
      // Combine all tickets
      const allTickets = [...betaTicketsWithMeta, ...projectTickets];
      
      // Remove duplicates
      const uniqueTickets = allTickets.filter((ticket, index, self) => 
        index === self.findIndex(t => t.id === ticket.id)
      );
      
      setTickets(uniqueTickets);
      calculateTicketStats(uniqueTickets);
      
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [userId, expandedTickets]);

  // Calculate ticket statistics for the dashboard
  const calculateTicketStats = (ticketData: Ticket[]) => {
    const totalTickets = ticketData.length;
    const openTickets = ticketData.filter(ticket => 
      ticket.status !== 'done' && ticket.status !== 'closed'
    ).length;
    const closedTickets = totalTickets - openTickets;
    const highPriorityTickets = ticketData.filter(ticket => 
      ticket.priority === 'high'
    ).length;

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    ticketData.forEach(ticket => {
      const status = ticket.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      const priority = ticket.priority || 'unknown';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });

    setTicketStats({
      totalTickets,
      openTickets,
      closedTickets,
      highPriorityTickets,
      byStatus,
      byPriority
    });
  };

  // Handle ticket actions
  const handleTicketAction = useCallback(async (ticketId: string, action: string, data: any) => {
    try {
      switch (action) {
        case 'updateStatus':
          // Update ticket status
          await supabase
            .from('tickets')
            .update({ 
              status: data || 'new',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Ticket status updated");
          break;
          
        case 'updatePriority':
          // Update ticket priority
          await supabase
            .from('tickets')
            .update({ 
              priority: data || 'medium',
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Priority updated");
          break;
          
        case 'updateDueDate':
          // Update due date
          await supabase
            .from('tickets')
            .update({ 
              due_date: data,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Due date updated");
          break;
          
        case 'addNote':
          if (!userId || !data.trim()) return;
          
          // Get ticket details
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('notes')
            .eq('id', ticketId)
            .maybeSingle();
          
          // Get user details
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
            
          const userName = profileData ? 
            `${profileData.first_name || ''} ${profileData.last_name || ''}` : 
            'User';
          
          // Create new note
          const newNote = {
            id: Date.now().toString(),
            user: userName.trim(),
            timestamp: new Date().toISOString(),
            comment: data
          };
          
          // Update notes array
          const currentNotes = ticketData?.notes || [];
          const updatedNotes = [...currentNotes, newNote];
          
          // Save to database
          await supabase
            .from('tickets')
            .update({ 
              notes: updatedNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          toast.success("Note added successfully");
          break;
          
        default:
          console.warn('Unknown action:', action);
      }
      
      // Refresh tickets after any update
      loadAllTickets();
    } catch (error) {
      console.error(`Error handling ticket action ${action}:`, error);
      toast.error(`Failed to perform action: ${action}`);
    }
  }, [userId, loadAllTickets]);

  // Handle expanding/collapsing ticket details
  const handleToggleTicket = useCallback((ticketId: string, isExpanded: boolean) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: isExpanded
    }));
    
    if (isExpanded) {
      setSelectedTicket(ticketId);
    } else if (selectedTicket === ticketId) {
      setSelectedTicket(null);
    }
  }, [selectedTicket]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setDashboardKey(prev => prev + 1);
    loadAllTickets();
  }, [loadAllTickets]);

  // Load tickets on mount and when dependencies change
  useEffect(() => {
    if (userId) {
      loadAllTickets();
    }
  }, [userId, loadAllTickets]);

  if (!userId) {
    return <div>User ID is required to show projects</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>View and manage your project tasks</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No projects or tickets found.</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
                <TabsTrigger value="project-tickets">Project Tickets</TabsTrigger>
                <TabsTrigger value="beta-tickets">Beta Testing Tickets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-tickets">
                <TicketStats
                  totalTickets={ticketStats.totalTickets}
                  openTickets={ticketStats.openTickets}
                  closedTickets={ticketStats.closedTickets}
                  highPriorityTickets={ticketStats.highPriorityTickets}
                  byStatus={ticketStats.byStatus}
                  byPriority={ticketStats.byPriority}
                />
                
                <TicketDashboard
                  key={`all-${dashboardKey}`}
                  initialTickets={tickets}
                  onRefresh={handleRefresh}
                  onTicketExpand={handleToggleTicket}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={true}
                  currentUserId={userId}
                />
              </TabsContent>
              
              <TabsContent value="project-tickets">
                <TicketDashboard
                  key={`project-${dashboardKey}`}
                  initialTickets={tickets.filter(ticket => ticket.isProjectTicket)}
                  onRefresh={handleRefresh}
                  onTicketExpand={handleToggleTicket}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={true}
                  currentUserId={userId}
                />
              </TabsContent>
              
              <TabsContent value="beta-tickets">
                <TicketDashboard
                  key={`beta-${dashboardKey}`}
                  initialTickets={tickets.filter(ticket => !ticket.isProjectTicket)}
                  onRefresh={handleRefresh}
                  onTicketExpand={handleToggleTicket}
                  onTicketAction={handleTicketAction}
                  showTimeTracking={false}
                  currentUserId={userId}
                />
              </TabsContent>
            </Tabs>
          )}
          
          {selectedTicket && userId && tickets.find(t => t.id === selectedTicket)?.isTaskTicket && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeTracker 
                    ticketId={selectedTicket} 
                    userId={userId} 
                    jobAppId={tickets.find(t => t.id === selectedTicket)?.job_app_id}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
