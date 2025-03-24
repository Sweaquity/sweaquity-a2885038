
// Update props and fix TypeScript errors
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Task, Ticket } from "@/types/types";
import { toast } from "sonner";
import { FilterBar } from "@/components/ticket/FilterBar";
import { KanbanBoard } from "@/components/ticket/KanbanBoard";
import { TaskCompletionReview } from "../projects/TaskCompletionReview";
import { GanttChartView } from "../testing/GanttChartView";
import { DragDropContext } from "react-beautiful-dnd";

interface LiveProjectsTabProps {
  projectId?: string | null;
}

export const LiveProjectsTab: React.FC<LiveProjectsTabProps> = ({ projectId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    fetchTickets();
    // Get the current business ID
    const getCurrentBusinessId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setBusinessId(data.user.id);
      }
    };
    getCurrentBusinessId();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .not('project_id', 'is', null);

      if (error) throw error;
      
      // Ensure all tickets have a description (required by type)
      const ticketsWithDescription = (data || []).map(ticket => ({
        ...ticket,
        description: ticket.description || ""
      }));
      
      setTickets(ticketsWithDescription);
      setFilteredTickets(ticketsWithDescription);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // First update the ticket status in the tickets table
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;
      
      // Get the ticket to check if it's a task ticket
      const { data: ticketData, error: getError } = await supabase
        .from('tickets')
        .select('task_id, project_id')
        .eq('id', ticketId)
        .single();
        
      if (getError) throw getError;
      
      // If this is a task ticket, also update the project_sub_tasks table
      if (ticketData.task_id) {
        let taskStatus = newStatus;
        // Map ticket status to task status if different terminology is used
        if (newStatus === 'done') {
          taskStatus = 'pending_review';
        } else if (newStatus === 'closed') {
          taskStatus = 'completed';
        }
        
        const { error: taskError } = await supabase
          .from('project_sub_tasks')
          .update({ 
            task_status: taskStatus,
            last_activity_at: new Date().toISOString()
          })
          .eq('task_id', ticketData.task_id);
        
        if (taskError) throw taskError;
      }
      
      toast.success("Ticket status updated");
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error("Failed to update ticket status");
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (newFilters: any) => {
    let filtered = [...tickets];

    if (newFilters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === newFilters.status);
    }

    if (newFilters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === newFilters.priority);
    }

    setFilteredTickets(filtered);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    updateTicketStatus(draggableId, destination.droppableId);
  };

  const handleTicketClick = async (ticket: Ticket) => {
    if (!ticket.task_id) return;

    try {
      const { data, error } = await supabase
        .from('project_sub_tasks')
        .select('*')
        .eq('task_id', ticket.task_id)
        .single();

      if (error) throw error;
      setSelectedTask(data);
      setShowReviewDialog(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
      toast.error("Failed to load task details");
    }
  };

  const getGanttTasks = useCallback((): any[] => {
    return tickets.map(ticket => ({
      id: ticket.id,
      name: ticket.title,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      start: new Date(new Date().setDate(new Date().getDate() - 3)),
      end: ticket.due_date ? new Date(ticket.due_date) : new Date(new Date().setDate(new Date().getDate() + 4)),
      progress: ticket.status === 'done' ? 100 :
               ticket.status === 'review' ? 75 :
               ticket.status === 'in-progress' ? 50 :
               ticket.status === 'blocked' ? 25 : 0,
      type: 'task',
      isDisabled: false
    }));
  }, [tickets]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Tickets</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={fetchTickets}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kanban">
            <TabsList className="mb-4">
              <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kanban">
              <FilterBar 
                onFilterChange={handleFilterChange} 
                statuses={['all', 'todo', 'in-progress', 'review', 'done', 'closed']}
                priorities={['all', 'low', 'medium', 'high', 'urgent']}
              />
              
              <div className="mt-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <KanbanBoard 
                    tickets={filteredTickets} 
                    onStatusChange={updateTicketStatus}
                    onTicketClick={handleTicketClick}
                  />
                </DragDropContext>
              </div>
            </TabsContent>
            
            <TabsContent value="gantt">
              <GanttChartView tasks={getGanttTasks()} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Task review dialog */}
      {selectedTask && businessId && (
        <TaskCompletionReview 
          businessId={businessId}
        />
      )}
    </div>
  );
};
