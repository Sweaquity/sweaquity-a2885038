
import React, { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/ticket/KanbanBoard';
import { supabase } from '@/lib/supabase';
import { CreateTicketDialog } from '@/components/ticket/CreateTicketDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStats } from '@/components/ticket/TicketStats';
import { Ticket, KanbanColumn } from '@/types/types';
import { toast } from 'sonner';

interface JobSeekerProjectsTabProps {
  userId?: string;
}

export const JobSeekerProjectsTab = ({ userId }: JobSeekerProjectsTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0
  });

  // Load user's tickets and projects they're involved in
  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      // Fetch projects the job seeker is involved in
      const { data: projectsData, error: projectsError } = await supabase
        .from('jobseeker_active_projects')
        .select('*')
        .eq('user_id', userId);
        
      if (projectsError) throw projectsError;
      
      // Collect all project IDs and task IDs
      const projectIds = projectsData?.map(p => p.project_id).filter(Boolean) || [];
      const taskIds = projectsData?.map(p => p.task_id).filter(Boolean) || [];
      
      if (projectIds.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setUserProjects(projectsData || []);
      
      // Fetch tickets where either:
      // 1. The user is the reporter
      // 2. The user is assigned to the ticket
      // 3. The ticket is related to one of the user's projects
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .or(`reporter.eq.${userId},assigned_to.eq.${userId},project_id.in.(${projectIds.join(',')})`)
        .order('created_at', { ascending: false });
        
      if (ticketsError) throw ticketsError;
      
      // Map the tickets to include type property for compatibility
      const mappedTickets = (ticketsData || []).map(ticket => ({
        ...ticket,
        // Ensure type property is set for compatibility
        type: ticket.ticket_type || 'task'
      }));
      
      setTickets(mappedTickets);
      
      // Calculate statistics
      const stats = {
        total: mappedTickets.length,
        open: mappedTickets.filter(t => t.status !== 'done' && t.status !== 'completed').length,
        closed: mappedTickets.filter(t => t.status === 'done' || t.status === 'completed').length,
        highPriority: mappedTickets.filter(t => t.priority === 'high').length
      };
      
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading job seeker projects data:', error);
      toast.error('Failed to load projects data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler for creating a new ticket
  const handleCreateTicket = async (ticketData: any): Promise<void> => {
    try {
      // Make sure the ticket has the required fields and defaults
      const newTicket = {
        ...ticketData,
        // Set reporter to current user
        reporter: userId,
        // Ensure ticket_type is set correctly (not just type)
        ticket_type: ticketData.type || 'task',
        // Set default status if not provided
        status: ticketData.status || 'backlog',
        // Set creation date
        created_at: new Date().toISOString(),
        // Set update date
        updated_at: new Date().toISOString()
      };
      
      // Insert the ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert(newTicket)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the new ticket to the state
      setTickets(prev => [data, ...prev]);
      
      // Update statistics
      setStatistics(prev => ({
        ...prev,
        total: prev.total + 1,
        open: prev.open + 1,
        highPriority: ticketData.priority === 'high' ? prev.highPriority + 1 : prev.highPriority
      }));
      
      toast.success('Ticket created successfully');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  // Prepare ticket data for KanbanBoard
  const prepareColumns = (): KanbanColumn[] => {
    // Define column structure
    const columns: KanbanColumn[] = [
      { id: 'backlog', title: 'Backlog', tickets: [] },
      { id: 'in-progress', title: 'In Progress', tickets: [] },
      { id: 'review', title: 'Review', tickets: [] },
      { id: 'done', title: 'Done', tickets: [] }
    ];
    
    // Map tickets to their respective columns
    tickets.forEach(ticket => {
      // Map ticket status to column
      const status = ticket.status?.toLowerCase() || '';
      let columnId: string;
      
      if (status === 'backlog' || status === 'todo' || status === 'pending') {
        columnId = 'backlog';
      } else if (status === 'in progress' || status === 'in-progress') {
        columnId = 'in-progress';
      } else if (status === 'review' || status === 'testing' || status === 'qa') {
        columnId = 'review';
      } else if (status === 'done' || status === 'completed') {
        columnId = 'done';
      } else {
        // Default to backlog for unknown statuses
        columnId = 'backlog';
      }
      
      // Find the column and add the ticket
      const column = columns.find(col => col.id === columnId);
      if (column) {
        column.tickets.push(ticket);
      }
    });
    
    return columns;
  };

  // Handle ticket status update
  const handleTicketStatusUpdate = async (ticketId: string, newStatus: string): Promise<void> => {
    try {
      // Map column IDs to status values
      let statusValue: string;
      
      if (newStatus === 'backlog') {
        statusValue = 'backlog';
      } else if (newStatus === 'in-progress') {
        statusValue = 'in progress';
      } else if (newStatus === 'review') {
        statusValue = 'review';
      } else if (newStatus === 'done') {
        statusValue = 'done';
      } else {
        statusValue = newStatus;
      }
      
      // Update the ticket in the database
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: statusValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: statusValue } : ticket
      ));
      
      // Update statistics if ticket is moved to/from done
      const ticket = tickets.find(t => t.id === ticketId);
      const wasClosed = ticket?.status === 'done' || ticket?.status === 'completed';
      const isClosed = statusValue === 'done' || statusValue === 'completed';
      
      if (wasClosed !== isClosed) {
        setStatistics(prev => ({
          ...prev,
          open: isClosed ? prev.open - 1 : prev.open + 1,
          closed: isClosed ? prev.closed + 1 : prev.closed - 1
        }));
      }
      
      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  // Get projects for the create ticket dialog
  const getProjectsList = () => {
    return userProjects.map(project => ({
      project_id: project.project_id,
      project_title: project.project_title || 'Untitled Project'
    }));
  };

  // Show empty state when no tickets
  if (!isLoading && tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>You don't have any tickets yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">Create a new ticket to track your tasks and issues</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Tickets</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>
      
      {/* Ticket Statistics */}
      <TicketStats statistics={statistics} />
      
      {/* Kanban Board */}
      <KanbanBoard 
        columns={prepareColumns()} 
        onTicketMove={handleTicketStatusUpdate}
      />
      
      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreateTicket={handleCreateTicket}
        projects={getProjectsList()}
      />
    </div>
  );
};
